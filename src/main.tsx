import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from '@/components/ui/sonner'
import { AppShell } from '@/components/AppShell'
import { RepoContext } from '@/lib/repo-context'
import { createRepository } from '@/storage/idbRepo'
import type { DataRoomRepository } from '@/storage/repository'
import './index.css'

function Root() {
  const [repo, setRepo] = useState<DataRoomRepository | null>(null)
  const [degraded, setDegraded] = useState(false)

  useEffect(() => {
    void createRepository().then(({ repo, persistenceDegraded }) => {
      setRepo(repo)
      setDegraded(persistenceDegraded)
    })
  }, [])

  if (!repo) {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }

  return (
    <RepoContext.Provider value={repo}>
      <AppShell persistenceDegraded={degraded} />
      <Toaster richColors position="top-center" />
    </RepoContext.Provider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
