"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

type UserListWriteError = {
  code?: string
} | null

const UNIQUE_VIOLATION = '23505'

const isUniqueViolation = (error: UserListWriteError) =>
  error?.code === UNIQUE_VIOLATION

export default function ActionButtons({ titleId, type }: { titleId: string, type: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState<'watching' | 'completed' | null>(null)

  const handleAddToList = async (status: 'watching' | 'completed') => {
    setLoading(status)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        alert("برای افزودن به لیست، ابتدا باید وارد شوید.")
        router.push("/auth")
        return
      }

      const mediaId = Number(titleId)
      const listEntry = {
        user_id: session.user.id,
        title_id: mediaId,
        title_type: type,
        status,
      }

      // M0 rollout bridge:
      // Avoid coupling the deployed app to either the legacy 2-column
      // or the canonical 3-column ON CONFLICT target during migration.
      //
      // 1) A new canonical row inserts directly.
      // 2) A 23505 for the same canonical row becomes an exact 3-column update.
      // 3) If no exact row exists, production is still on the legacy
      //    (user_id,title_id) uniqueness rule, so preserve legacy last-write
      //    behavior until the migration is applied.
      //
      // Remove this bridge after production migration + post-deploy verification,
      // then return to a canonical 3-column upsert.
      const { error: insertError } = await supabase
        .from('user_lists')
        .insert(listEntry)

      let error = insertError

      if (isUniqueViolation(error)) {
        const { data: exactRows, error: exactUpdateError } = await supabase
          .from('user_lists')
          .update({ status })
          .eq('user_id', session.user.id)
          .eq('title_id', mediaId)
          .eq('title_type', type)
          .select('id')

        error = exactUpdateError

        if (!error && (exactRows?.length ?? 0) === 0) {
          const { error: legacyUpdateError } = await supabase
            .from('user_lists')
            .update({
              title_type: type,
              status,
            })
            .eq('user_id', session.user.id)
            .eq('title_id', mediaId)

          error = legacyUpdateError
        }
      }

      if (error) {
        alert("خطا در ذخیره اطلاعات: " + error.message)
      } else {
        alert(status === 'watching' ? "به لیست 'در حال تماشا' اضافه شد!" : "به لیست 'تماشا شده' اضافه شد!")
        router.refresh()
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      <Button
        onClick={() => handleAddToList('watching')}
        disabled={loading !== null}
        className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg"
      >
        {loading === 'watching' ? "در حال ذخیره..." : "➕ افزودن به لیست (در حال تماشا)"}
      </Button>

      {/* دکمه تماشا کردم با رنگ سبز برای وضوح روی بک‌گراند تاریک */}
      <Button
        onClick={() => handleAddToList('completed')}
        disabled={loading !== null}
        variant="outline"
        className="w-full border-green-600 text-green-500 hover:bg-green-600 hover:text-white py-6 text-lg"
      >
        {loading === 'completed' ? "در حال ذخیره..." : "✅ تماشا کردم"}
      </Button>
    </div>
  )
}
