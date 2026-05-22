import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { FamilyTree, TreeNode, CreateRelationshipPayload } from '../types/tree'

export const useTrees = () =>
  useQuery({
    queryKey: ['trees'],
    queryFn: () => api.get<FamilyTree[]>('/trees').then(r => r.data),
  })

export const useTreeNode = (treeId: string, personId: string, levels = 1) =>
  useQuery({
    queryKey: ['treeNode', treeId, personId, levels],
    queryFn: () =>
      api.get<TreeNode>(`/trees/${treeId}/node/${personId}?levels=${levels}`).then(r => r.data),
    enabled: !!treeId && !!personId,
  })

export const useCreateTree = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { surname: string; description?: string }) =>
      api.post<FamilyTree>('/trees', payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trees'] })
      qc.invalidateQueries({ queryKey: ['surnames'] })
    },
  })
}

export const useAddRelationship = (treeId: string) =>
  useMutation({
    mutationFn: (payload: CreateRelationshipPayload) =>
      api.post(`/trees/${treeId}/relationships`, payload),
  })

export const useRemoveRelationship = (treeId: string) =>
  useMutation({
    mutationFn: (payload: { personAId: string; personBId: string }) =>
      api.delete(`/trees/${treeId}/relationships`, { data: payload }),
  })

export const useRemovePersonFromTree = (treeId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (personId: string) =>
      api.delete(`/trees/${treeId}/members/${personId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['surnames'] })
      qc.invalidateQueries({ queryKey: ['trees'] })
    },
  })
}
