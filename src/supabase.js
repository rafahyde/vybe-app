import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://aicyggsnmmjqefqeldlb.supabase.co"

const SUPABASE_KEY = "sb_publishable_WSX0bfOlMXopUZmMVHvU3g_aeMQVz0z"

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)