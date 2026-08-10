import { createContext, useContext } from 'react'
import type { DataRoomRepository } from '@/storage/repository'

export const RepoContext = createContext<DataRoomRepository | null>(null)

export function useRepo(): DataRoomRepository {
  const repo = useContext(RepoContext)
  if (!repo) throw new Error('RepoContext missing')
  return repo
}
