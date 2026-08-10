import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { Session } from '@supabase/supabase-js'
import { Toaster } from '@/components/ui/sonner'
import { AuthGate } from '@/components/auth/AuthGate'
import { AppShell } from '@/components/AppShell'
import { RepoContext } from '@/lib/repo-context'
import { getSupabase, hasSupabaseConfig } from '@/lib/supabase'
import { bootstrapRepository } from '@/storage/bootstrap'
import type { DataRoomRepository } from '@/storage/repository'
import './index.css'

function Root() {
  const cloud = hasSupabaseConfig()
  const [session, setSession] = useState<Session | null | undefined>(
    cloud ? undefined : null,
  )
  const [repo, setRepo] = useState<DataRoomRepository | null>(null)
  const [degraded, setDegraded] = useState(false)
  const [mode, setMode] = useState<'supabase' | 'idb' | 'memory'>('idb')
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    if (!cloud) {
      void bootstrapRepository(null).then((r) => {
        setRepo(r.repo)
        setDegraded(r.persistenceDegraded)
        setMode(r.mode)
        setSession(null)
        setBooting(false)
      })
      return
    }

    const supabase = getSupabase()
    let cancelled = false

    void supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setSession(data.session)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [cloud])

  useEffect(() => {
    if (session === undefined) return
    let cancelled = false
    setBooting(true)
    void bootstrapRepository(session).then((r) => {
      if (cancelled) return
      setRepo(r.repo)
      setDegraded(r.persistenceDegraded)
      setMode(r.mode)
      setBooting(false)
    })
    return () => {
      cancelled = true
    }
  }, [session])

  if (booting || session === undefined) {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (cloud && !session) {
    return (
      <>
        <AuthGate />
        <Toaster richColors position="top-center" />
      </>
    )
  }

  if (!repo) {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }

  return (
    <RepoContext.Provider value={repo}>
      <AppShell
        persistenceDegraded={degraded}
        cloudMode={mode === 'supabase'}
        userEmail={session?.user.email ?? null}
        onSignOut={
          cloud
            ? async () => {
                await getSupabase().auth.signOut()
              }
            : undefined
        }
      />
      <Toaster richColors position="top-center" />
    </RepoContext.Provider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
