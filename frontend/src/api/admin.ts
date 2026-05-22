import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'

export interface TreeAdmin {
  personId: string
  fullName: string
}

export const useTreeAdmins = (treeId: string | null) =>
  useQuery({
    queryKey: ['treeAdmins', treeId],
    queryFn: () =>
      api.get<TreeAdmin[]>(`/admin/trees/${treeId}/admins`).then(r => r.data),
    enabled: !!treeId,
  })

/**
 * Tree IDs where the given person is a family admin. Source of truth for
 * `useAuth().canEditTree`. Disabled when `personId` is null (power admins and
 * community members don't need it).
 */
export const useTreesByAdmin = (personId: string | null | undefined) =>
  useQuery({
    queryKey: ['myAssignedTrees', personId],
    queryFn: () =>
      api.get<string[]>(`/admin/trees-by-admin/${personId}`).then(r => r.data),
    enabled: !!personId,
  })

function invalidateAdminCaches(qc: ReturnType<typeof useQueryClient>, treeId: string | null) {
  qc.invalidateQueries({ queryKey: ['treeAdmins', treeId] })
  // Any user whose adminship just changed must refetch their assigned-trees list.
  qc.invalidateQueries({ queryKey: ['myAssignedTrees'] })
}

export const useAssignTreeAdmin = (treeId: string | null) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (personId: string) =>
      api.post(`/admin/trees/${treeId}/admins/${personId}`),
    onSuccess: () => invalidateAdminCaches(qc, treeId),
  })
}

export const useRemoveTreeAdmin = (treeId: string | null) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (personId: string) =>
      api.delete(`/admin/trees/${treeId}/admins/${personId}`),
    onSuccess: () => invalidateAdminCaches(qc, treeId),
  })
}
