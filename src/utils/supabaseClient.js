import { createClient } from '@supabase/supabase-js'

// Variables de entorno (Next.js solo expone las que empiezan con NEXT_PUBLIC_)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validación para no romper la app en producción
if (!supabaseUrl) {
  console.error("❌ Falta la variable NEXT_PUBLIC_SUPABASE_URL en Vercel/entorno.")
}

if (!supabaseAnonKey) {
  console.error("❌ Falta la variable NEXT_PUBLIC_SUPABASE_ANON_KEY en Vercel/entorno.")
}

// Creamos el cliente (aunque falten las variables, así no crashea la app entera)
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder_key"
)
