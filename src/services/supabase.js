import { createClient } from '@supabase/supabase-js'

// ============================================================
// CLIENT SUPABASE — point d'entrée unique pour toute l'app
// ============================================================
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)