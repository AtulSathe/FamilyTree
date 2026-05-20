import { create } from 'zustand'
import type { AuthUser, UserRole } from '../types/auth'

interface AuthStore {
  user: AuthUser
  setUser: (user: AuthUser) => void
}

// Default mock user — replaced by real JWT claims in production
const defaultUser: AuthUser = {
  id: '00000000-0000-0000-0000-000000000002',
  email: 'sathe.admin@familytree.dev',
  fullName: 'Ramesh Sathe',
  role: 'family_admin',
  assignedTrees: ['10000000-0000-0000-0000-000000000001'],
}

export const useAuthStore = create<AuthStore>(set => ({
  user: defaultUser,
  setUser: (user) => set({ user }),
}))

export const useAuth = () => {
  const { user } = useAuthStore()
  return {
    user,
    role: user.role as UserRole,
    isPowerAdmin: user.role === 'power_admin',
    canEdit: user.role === 'power_admin' || user.role === 'family_admin',
    canEditTree: (treeId: string) =>
      user.role === 'power_admin' || user.assignedTrees.includes(treeId),
  }
}
