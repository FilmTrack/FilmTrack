import { createBrowserClient } from '@supabase/ssr'

const PREVIEW_DISABLED_SUPABASE_URL = 'https://preview-disabled.invalid'
const PREVIEW_DISABLED_SUPABASE_ANON_KEY = 'preview-disabled-anon-key'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || PREVIEW_DISABLED_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || PREVIEW_DISABLED_SUPABASE_ANON_KEY
  )
}
