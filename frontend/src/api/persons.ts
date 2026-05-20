import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { Person, PersonDetail, CreatePersonPayload, UpdatePersonPayload } from '../types/person'

export const usePerson = (id: string) =>
  useQuery({
    queryKey: ['person', id],
    queryFn: () => api.get<Person>(`/persons/${id}`).then(r => r.data),
    enabled: !!id,
  })

export const usePersonDetail = (id: string) =>
  useQuery({
    queryKey: ['personDetail', id],
    queryFn: () => api.get<PersonDetail>(`/persons/${id}/detail`).then(r => r.data),
    enabled: !!id,
  })

export const useCreatePerson = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePersonPayload) =>
      api.post<Person>('/persons', payload).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['persons'] }),
  })
}

export const useUpdatePerson = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdatePersonPayload) =>
      api.put<Person>(`/persons/${id}`, payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['person', id] })
      qc.invalidateQueries({ queryKey: ['personDetail', id] })
    },
  })
}

export const useDeletePerson = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete(`/persons/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['persons'] }),
  })
}

export const useSearchExisting = (q: string) =>
  useQuery({
    queryKey: ['searchExisting', q],
    queryFn: () =>
      api.get<Person[]>(`/persons/search-existing?q=${encodeURIComponent(q)}`).then(r => r.data),
    enabled: q.length >= 2,
  })
