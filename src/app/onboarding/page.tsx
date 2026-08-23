import { redirect } from "next/navigation";

import OnboardingActivation from "@/components/OnboardingActivation";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) redirect("/auth");

  const { count } = await supabase
    .from("user_lists")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  return (
    <main className="min-h-screen bg-[#0e0e0e]">
      <OnboardingActivation initialCount={count ?? 0} />
    </main>
  );
}
