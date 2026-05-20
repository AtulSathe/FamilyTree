export type UserRole = 'power_admin' | 'family_admin' | 'community_member'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: UserRole
  assignedTrees: string[]
}
