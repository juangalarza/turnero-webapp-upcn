import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Admin client — usar SOLO en API Routes y Server Actions protegidas
// Usa la SERVICE_ROLE_KEY que bypasea RLS → nunca exponer al cliente
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
