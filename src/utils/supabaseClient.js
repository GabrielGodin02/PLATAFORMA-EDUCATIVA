import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.error("❌ Falta REACT_APP_SUPABASE_URL")
}

if (!supabaseAnonKey) {
  console.error("❌ Falta REACT_APP_SUPABASE_ANON_KEY")
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder_key"
)
