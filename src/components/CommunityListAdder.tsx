"use client";

import { useEffect, useState } from "react";
import { addCommunityListItem } from "@/lib/m3/community-content-client";
import { isCommunityContentRuntimeEnabled } from "@/lib/m3/community-content-readiness";
import { createClient } from "@/lib/supabase/client";

type UserList = { id: string; name: string };

export default function CommunityListAdder({ titleId, titleType }: { titleId: number; titleType: "movie" | "tv" }) {
  const [lists, setLists] = useState<UserList[]>([]);
  const [listId, setListId] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isCommunityContentRuntimeEnabled()) return;
    const supabase = createClient();
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("community_lists").select("id,name").eq("user_id", user.id).order("created_at", { ascending: false });
      setLists((data || []) as UserList[]);
      if (data?.[0]?.id) setListId(data[0].id);
    })();
  }, []);

  async function add() {
    if (!listId) return;
    setBusy(true);
    const result = await addCommunityListItem({ listId, titleId, titleType });
    setBusy(false);
    setMessage(result.ok ? "به فهرست اضافه شد." : "افزودن به فهرست انجام نشد.");
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5" dir="rtl">
      <h2 className="text-lg font-black text-white">افزودن به فهرست سفارشی</h2>
      {lists.length === 0 ? <p className="mt-3 text-sm text-slate-500">اول از مرکز محتوای اجتماعی یک فهرست بساز.</p> : <div className="mt-4 flex flex-col gap-3 sm:flex-row"><select value={listId} onChange={(e) => setListId(e.target.value)} className="min-h-11 flex-1 rounded-xl border border-white/10 bg-[#0b1220] px-3 text-sm text-white">{lists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}</select><button onClick={add} disabled={busy || !listId} className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-black text-white disabled:opacity-40">{busy ? "در حال افزودن…" : "افزودن"}</button></div>}
      {message ? <p className="mt-3 text-xs text-slate-400">{message}</p> : null}
    </section>
  );
}
