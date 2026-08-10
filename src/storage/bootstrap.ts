import { createRepository as createIdbRepository } from '@/storage/idbRepo'
import type { DataRoomRepository } from '@/storage/repository'
import { getSupabase, hasSupabaseConfig } from '@/lib/supabase'
import { SupabaseRepository } from '@/storage/supabaseRepo'
import type { Session, User } from '@supabase/supabase-js'

export type BootstrapResult = {
  mode: 'supabase' | 'idb' | 'memory'
  repo: DataRoomRepository | null
  persistenceDegraded: boolean
  session: Session | null
  user: User | null
}

/** Prefer Supabase when env present; otherwise IndexedDB (/memory fallback). */
export async function bootstrapRepository(
  session: Session | null,
): Promise<BootstrapResult> {
  if (hasSupabaseConfig()) {
    if (!session?.user) {
      return {
        mode: 'supabase',
        repo: null,
        persistenceDegraded: false,
        session: null,
        user: null,
      }
    }
    const client = getSupabase()
    return {
      mode: 'supabase',
      repo: new SupabaseRepository(client, session.user),
      persistenceDegraded: false,
      session,
      user: session.user,
    }
  }

  const { repo, persistenceDegraded } = await createIdbRepository()
  return {
    mode: persistenceDegraded ? 'memory' : 'idb',
    repo,
    persistenceDegraded,
    session: null,
    user: null,
  }
}
