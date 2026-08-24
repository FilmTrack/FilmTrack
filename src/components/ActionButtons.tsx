"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import type { TitleType, UserListStatus } from "@/lib/user-lists/types"
import { writeUserListEntry } from "@/lib/user-lists/write"

type ActionStatus = Extract<UserListStatus, "watching" | "completed">

export default function ActionButtons({
  titleId,
  type,
}: {
  titleId: string
  type: TitleType
}) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState<ActionStatus | null>(null)

  const handleAddToList = async (status: ActionStatus) => {
    setLoading(status)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        alert("برای افزودن به لیست، ابتدا باید وارد شوید.")
        router.push("/auth")
        return
      }

      const mediaId = Number(titleId)

      const { error } = await writeUserListEntry(
        supabase,
        session.user.id,
        mediaId,
        type,
        status,
      )

      if (error) {
        alert("خطا در ذخیره اطلاعات: " + error.message)
        return
      }

      alert(
        status === "watching"
          ? "به لیست 'در حال تماشا' اضافه شد!"
          : "به لیست 'تماشا شده' اضافه شد!",
      )

      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      <Button
        onClick={() => handleAddToList("watching")}
        disabled={loading !== null}
        className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg"
      >
        {loading === "watching"
          ? "در حال ذخیره..."
          : "➕ افزودن به لیست (در حال تماشا)"}
      </Button>

      <Button
        onClick={() => handleAddToList("completed")}
        disabled={loading !== null}
        variant="outline"
        className="w-full border-green-600 text-green-500 hover:bg-green-600 hover:text-white py-6 text-lg"
      >
        {loading === "completed" ? "در حال ذخیره..." : "✅ تماشا کردم"}
      </Button>
    </div>
  )
}
