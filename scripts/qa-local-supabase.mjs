import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error("Local Supabase URL/key are required");
}

if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(url)) {
  throw new Error(`Safety abort: authenticated QA must use local Supabase only, got ${url}`);
}

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = `FilmTrack-QA-${runId}!`;
const ownerEmail = `filmtrack-owner-${runId}@example.test`;
const outsiderEmail = `filmtrack-outsider-${runId}@example.test`;

async function createSignedInClient(email) {
  const client = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data: signUpData, error: signUpError } = await client.auth.signUp({
    email,
    password,
  });

  if (signUpError) throw signUpError;

  let session = signUpData.session;
  if (!session) {
    const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) throw signInError;
    session = signInData.session;
  }

  if (!session?.user?.id) {
    throw new Error(`No authenticated session for ${email}`);
  }

  return { client, user: session.user };
}

const owner = await createSignedInClient(ownerEmail);
const outsider = await createSignedInClient(outsiderEmail);

const titleId = 990000000 + Math.floor(Math.random() * 9000000);
const payload = {
  user_id: owner.user.id,
  title_id: titleId,
  title_type: "movie",
  status: "plan_to_watch",
};

const { data: inserted, error: insertError } = await owner.client
  .from("user_lists")
  .insert(payload)
  .select("id,user_id,title_id,title_type,status")
  .single();

if (insertError) throw insertError;
if (inserted.user_id !== owner.user.id || inserted.title_id !== titleId) {
  throw new Error("Owner-scoped insert/read contract failed");
}

const { data: ownerRows, error: ownerReadError } = await owner.client
  .from("user_lists")
  .select("id,user_id,title_id,title_type,status")
  .eq("id", inserted.id);

if (ownerReadError) throw ownerReadError;
if (ownerRows.length !== 1) {
  throw new Error("Owner cannot read own row through RLS");
}

const { data: outsiderRows, error: outsiderReadError } = await outsider.client
  .from("user_lists")
  .select("id,user_id,title_id,title_type,status")
  .eq("id", inserted.id);

if (outsiderReadError) throw outsiderReadError;
if (outsiderRows.length !== 0) {
  throw new Error("RLS isolation failed: outsider can read owner row");
}

const { error: spoofInsertError } = await outsider.client.from("user_lists").insert({
  user_id: owner.user.id,
  title_id: titleId + 1,
  title_type: "movie",
  status: "plan_to_watch",
});

if (!spoofInsertError) {
  throw new Error("RLS isolation failed: outsider inserted a row for another user");
}

const { error: deleteError } = await owner.client.from("user_lists").delete().eq("id", inserted.id);
if (deleteError) throw deleteError;

console.log(
  JSON.stringify(
    {
      ok: true,
      backend: "local-supabase",
      auth: "pass",
      owner_write_read: "pass",
      outsider_read_isolation: "pass",
      outsider_write_isolation: "pass",
      cleanup: "pass",
    },
    null,
    2,
  ),
);
