"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Eye, MessageCircle, Send, ShieldAlert } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { isCommunityRuntimeEnabled } from "@/lib/m3/readiness"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"

type Comment = {
  id: string
  content: string
  is_spoiler: boolean
  created_at: string
}

type CommentAuthor = {
  username: string
  displayName: string | null
}

export default function CommentsSection({
  titleId,
  titleType,
  initialComments,
  isLoggedIn
}: {
  titleId: string,
  titleType: string,
  initialComments: Comment[],
  isLoggedIn: boolean
}) {
  const supabase = createClient()
  const router = useRouter()

  const [content, setContent] = useState("")
  const [isSpoiler, setIsSpoiler] = useState(false)
  const [loading, setLoading] = useState(false)
  const [revealedSpoilers, setRevealedSpoilers] = useState<string[]>([])
  const [authors, setAuthors] = useState<Record<string, CommentAuthor>>({})

  useEffect(() => {
    if (!isLoggedIn || !isCommunityRuntimeEnabled() || initialComments.length === 0) return

    let cancelled = false

    const loadAuthors = async () => {
      const commentIds = initialComments.map((comment) => comment.id)
      const { data: commentOwners, error: ownerError } = await supabase
        .from("comments")
        .select("id,user_id")
        .in("id", commentIds)

      if (ownerError || !commentOwners?.length) return

      const userIds = [...new Set(commentOwners.map((row) => row.user_id).filter(Boolean))]
      if (userIds.length === 0) return

      const { data: publicProfiles, error: profileError } = await supabase
        .from("community_profiles")
        .select("user_id,username,display_name")
        .eq("visibility", "public")
        .in("user_id", userIds)

      if (profileError || !publicProfiles?.length || cancelled) return

      const profileByUserId = new Map(
        publicProfiles.map((profile) => [profile.user_id, profile]),
      )
      const nextAuthors: Record<string, CommentAuthor> = {}

      for (const owner of commentOwners) {
        const profile = profileByUserId.get(owner.user_id)
        if (!profile) continue
        nextAuthors[String(owner.id)] = {
          username: profile.username,
          displayName: profile.display_name,
        }
      }

      if (!cancelled) setAuthors(nextAuthors)
    }

    void loadAuthors()

    return () => {
      cancelled = true
    }
  }, [initialComments, isLoggedIn, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      setLoading(false)
      router.push("/auth")
      return
    }

    const { error } = await supabase.from("comments").insert({
      content,
      is_spoiler: isSpoiler,
      title_id: Number(titleId),
      title_type: titleType,
      user_id: session.user.id
    })

    if (error) {
      alert("خطا در ارسال نظر: " + error.message)
    } else {
      setContent("")
      setIsSpoiler(false)
      router.refresh()
    }
    setLoading(false)
  }

  const revealSpoiler = (id: string) => {
    setRevealedSpoilers((current) => current.includes(id) ? current : [...current, id])
  }

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220]/90 shadow-2xl shadow-black/20 backdrop-blur" aria-labelledby="filmtrack-comments-title">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-gradient-to-l from-blue-500/10 via-violet-500/5 to-transparent px-4 py-4 sm:px-5">
        <div>
          <p className="text-xs font-medium text-blue-300">گفت‌وگوی FilmTrack</p>
          <h2 id="filmtrack-comments-title" className="mt-1 flex items-center gap-2 text-lg font-black text-white sm:text-xl">
            <MessageCircle className="h-5 w-5 text-blue-300" /> نظرات کاربران
          </h2>
        </div>
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-bold text-slate-400">
          {initialComments.length.toLocaleString("fa-IR")} نظر
        </span>
      </div>

      <div className="p-4 sm:p-5">
        {isLoggedIn ? (
          <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-white/10 bg-black/20 p-4">
            <label htmlFor="filmtrack-comment" className="mb-2 block text-sm font-bold text-white">نظر شما</label>
            <Textarea
              id="filmtrack-comment"
              placeholder="تجربه‌ات از این عنوان را بدون لو دادن داستان بنویس..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-28 resize-y border-white/10 bg-[#07101d] text-white placeholder:text-slate-600 focus-visible:ring-blue-500/40"
              rows={4}
              required
            />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="spoiler"
                  checked={isSpoiler}
                  onCheckedChange={(checked) => setIsSpoiler(checked === true)}
                />
                <label htmlFor="spoiler" className="cursor-pointer text-xs leading-6 text-slate-400 sm:text-sm">
                  این نظر حاوی اطلاعات داستانی است
                </label>
              </div>
              <Button type="submit" disabled={loading || !content.trim()} className="min-h-11 rounded-xl bg-gradient-to-l from-violet-600 to-blue-500 px-5 font-black text-white shadow-lg shadow-blue-950/30 hover:opacity-95">
                <Send className="h-4 w-4" />
                {loading ? "در حال ارسال..." : "ارسال نظر"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-blue-400/15 bg-blue-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-white">به گفت‌وگو بپیوند</p>
              <p className="mt-1 text-sm leading-6 text-slate-400">برای ثبت نظر و ساخت پروفایل سینمایی، وارد حساب FilmTrack شوید.</p>
            </div>
            <Link href="/auth" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 text-sm font-black text-blue-200 transition hover:bg-blue-500/20 hover:text-white">
              ورود / ساخت حساب
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {initialComments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-10 text-center">
              <MessageCircle className="mx-auto h-6 w-6 text-slate-600" />
              <p className="mt-3 font-bold text-slate-300">هنوز نظری ثبت نشده است</p>
              <p className="mt-1 text-sm text-slate-500">اولین گفت‌وگو درباره این عنوان را شما شروع کنید.</p>
            </div>
          ) : (
            initialComments.map((comment) => {
              const author = authors[comment.id]
              const spoilerHidden = comment.is_spoiler && !revealedSpoilers.includes(comment.id)

              return (
                <article key={comment.id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    {author ? (
                      <Link href={`/u/${author.username}`} className="text-sm font-black text-blue-300 transition hover:text-blue-200">
                        {author.displayName || `@${author.username}`}
                      </Link>
                    ) : (
                      <span className="text-sm font-black text-blue-300">کاربر FilmTrack</span>
                    )}
                    <time className="text-xs text-slate-600" dateTime={comment.created_at}>
                      {new Date(comment.created_at).toLocaleDateString("fa-IR")}
                    </time>
                  </div>

                  <div className={spoilerHidden ? "select-none blur-md" : ""} aria-hidden={spoilerHidden}>
                    <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">{comment.content}</p>
                  </div>

                  {spoilerHidden && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0b1220]/55 p-4 backdrop-blur-[2px]">
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-11 max-w-full rounded-xl border-amber-400/30 bg-[#07101d]/95 px-4 text-sm font-bold text-amber-200 hover:bg-amber-500/10 hover:text-amber-100"
                        onClick={() => revealSpoiler(comment.id)}
                      >
                        <ShieldAlert className="h-4 w-4 shrink-0" />
                        <span className="truncate">این نظر اطلاعات داستانی دارد</span>
                        <Eye className="h-4 w-4 shrink-0" />
                      </Button>
                    </div>
                  )}
                </article>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}
