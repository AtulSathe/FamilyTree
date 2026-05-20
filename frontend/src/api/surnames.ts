import { useQuery } from '@tanstack/react-query'
import { api } from './client'
import type { SurnameInfo, SurnameLink } from '../types/surname'

export const useSurnames = () =>
  useQuery({
    queryKey: ['surnames'],
    queryFn: () => api.get<SurnameInfo[]>('/surnames').then(r => r.data),
  })

export const useSurnameLinks = () =>
  useQuery({
    queryKey: ['surnameLinks'],
    queryFn: () => api.get<SurnameLink[]>('/surnames/relationships').then(r => r.data),
  })
