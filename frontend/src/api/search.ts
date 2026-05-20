import { useQuery } from '@tanstack/react-query'
import { api } from './client'
import type { SearchResult } from '../types/search'

export const useSearch = (q: string, surname?: string) =>
  useQuery({
    queryKey: ['search', q, surname],
    queryFn: () => {
      const params = new URLSearchParams({ q })
      if (surname) params.set('surname', surname)
      return api.get<SearchResult[]>(`/search?${params}`).then(r => r.data)
    },
    enabled: q.trim().length >= 2,
  })
