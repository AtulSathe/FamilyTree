import { create } from 'zustand'
import type { AuthUser, UserRole } from '../types/auth'
import { useTreesByAdmin } from '../api/admin'

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
  personId: '20000000-0000-0000-0000-000000000018',
}

export const useAuthStore = create<AuthStore>(set => ({
  user: defaultUser,
  setUser: (user) => set({ user }),
}))

export const useAuth = () => {
  const { user } = useAuthStore()
  // Only family admins need the live list; power admins bypass it and community
  // members can't edit anything regardless.
  const queryPersonId = user.role === 'family_admin' ? user.personId : undefined
  const { data: assignedFromServer } = useTreesByAdmin(queryPersonId)

  return {
    user,
    role: user.role as UserRole,
    isPowerAdmin: user.role === 'power_admin',
    canEdit: user.role === 'power_admin' || user.role === 'family_admin',
    canEditTree: (treeId: string) => {
      if (user.role === 'power_admin') return true
      // Deny until the live admin list has loaded — avoids briefly showing edit
      // affordances based on a stale seed when the user's admin status may have
      // changed on the server.
      return assignedFromServer?.includes(treeId) ?? false
    },
  }
}
