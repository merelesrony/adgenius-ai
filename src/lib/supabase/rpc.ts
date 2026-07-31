import type { Database } from '@/types/database'
import { createClient } from '@/lib/supabase/server'

type Functions = Database['public']['Functions']

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>

export function callRpc<T extends keyof Functions & string>(
  supabase: ServerSupabaseClient,
  functionName: T,
  args: Functions[T]['Args']
) {
  return supabase.rpc(functionName, args)
}
