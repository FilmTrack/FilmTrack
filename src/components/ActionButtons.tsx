"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function ActionButtons({ titleId, type }: { titleId: string, type: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState<'watching' | 'completed' | null>(null)

  const handleAddToList = async (status: 'watching' | 'completed') => {
    setLoading(status)
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      alert("برای افزودن به لیست، ابتدا باید وارد شوید.")
      router.push("/auth")
      return
    }

    const { error } = await supabase
      .from('user_lists')
      .upsert({ 
        user_id: session.user.id, 
        title_id: Number(titleId), 
        title_type: type, 
        status: status 
      }, {
        onConflict: 'user_id,title_id,title_type'
      })

    if (error) {
      alert("خطا در ذخیره اطلاعات: " + error.message)
    } else {
      alert(status === 'watching' ? "به لیست 'در حال تماشا' اضافه شد!" : "به لیست 'تماشا شده' اضافه شد!")
      router.refresh()
    }
    setLoading(null)
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
