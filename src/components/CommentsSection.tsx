"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      alert("برای ثبت نظر باید وارد شوید.")
      router.push("/auth")
      return
    }

    const { error } = await supabase.from('comments').insert({
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
      router.refresh() // رفرش صفحه تا نظر جدید بیاید
    }
    setLoading(false)
  }

  const revealSpoiler = (id: string) => {
    setRevealedSpoilers([...revealedSpoilers, id])
  }

  return (
    <div className="mt-12 border-t border-gray-800 pt-8">
      <h2 className="text-2xl font-bold mb-6">نظرات کاربران 💬</h2>

      {/* فرم ارسال نظر */}
      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="mb-8 bg-[#1a1a1a] p-4 rounded-xl border border-gray-800">
          <Textarea
            placeholder="نظر خود را درباره این عنوان بنویسید..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-[#0e0e0e] border-gray-700 text-white mb-3"
            rows={4}
            required
          />
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox 
                id="spoiler" 
                checked={isSpoiler} 
                onCheckedChange={(checked) => setIsSpoiler(checked === true)} 
              />
              <label htmlFor="spoiler" className="text-sm text-gray-400 cursor-pointer">
                نظر من حاوی اسپویلر (لو رفتن داستان) است
              </label>
            </div>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? "در حال ارسال..." : "ارسال نظر"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="mb-8 bg-[#1a1a1a] p-4 rounded-xl border border-gray-800 text-center text-gray-400">
          برای ثبت نظر، لطفاً ابتدا وارد حساب کاربری خود شوید.
        </div>
      )}

      {/* لیست نظرات */}
      <div className="space-y-4">
        {initialComments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">هنوز نظری برای این عنوان ثبت نشده است. اولین نفر باشید!</p>
        ) : (
          initialComments.map((comment) => (
            <div key={comment.id} className="bg-[#1a1a1a] p-4 rounded-xl border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-blue-500 text-sm">
                  کاربر FilmTrack
                </span>
                <span className="text-xs text-gray-600">
                  {new Date(comment.created_at).toLocaleDateString('fa-IR')}
                </span>
              </div>
              
              <div className={`relative ${comment.is_spoiler && !revealedSpoilers.includes(comment.id) ? 'blur-md select-none' : ''}`}>
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>

              {comment.is_spoiler && !revealedSpoilers.includes(comment.id) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="bg-black/80 border-red-600 text-red-500 hover:bg-red-600 hover:text-white"
                    onClick={() => revealSpoiler(comment.id)}
                  >
                    ⚠️ این نظر حاوی اسپویلر است. برای دیدن کلیک کنید.
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
