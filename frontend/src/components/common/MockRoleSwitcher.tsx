import { useAuthStore } from '../../store/authStore'
import type { AuthUser } from '../../types/auth'

const SATHE = '10000000-0000-0000-0000-000000000001'
const PANSE = '10000000-0000-0000-0000-000000000002'

interface RoleOption {
  label: string
  user: AuthUser
}

const OPTIONS: RoleOption[] = [
  {
    label: 'Power Admin',
    user: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'power.admin@familytree.dev',
      fullName: 'Power Admin',
      role: 'power_admin',
      assignedTrees: [],
    },
  },
  {
    label: 'Family Admin — Sathe',
    user: {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'sathe.admin@familytree.dev',
      fullName: 'Ramesh Sathe',
      role: 'family_admin',
      assignedTrees: [SATHE],
      personId: '20000000-0000-0000-0000-000000000018',
    },
  },
  {
    label: 'Family Admin — Panse',
    user: {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'panse.admin@familytree.dev',
      fullName: 'Govind Panse',
      role: 'family_admin',
      assignedTrees: [PANSE],
      personId: '20000000-0000-0000-0000-000000000012',
    },
  },
  {
    label: 'Community Member',
    user: {
      id: '00000000-0000-0000-0000-000000000004',
      email: 'viewer@familytree.dev',
      fullName: 'Community Viewer',
      role: 'community_member',
      assignedTrees: [],
    },
  },
]

export default function MockRoleSwitcher() {
  const { user, setUser } = useAuthStore()

  // Find the current option index by matching role + assignedTrees
  const currentIdx = OPTIONS.findIndex(
    o => o.user.role === user.role && o.user.id === user.id,
  )
  const value = currentIdx >= 0 ? String(currentIdx) : '1'

  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-300">
      <span className="text-xs font-semibold text-amber-600 whitespace-nowrap">DEV</span>
      <select
        value={value}
        onChange={e => setUser(OPTIONS[Number(e.target.value)].user)}
        className="text-xs text-amber-800 bg-transparent border-none outline-none cursor-pointer font-medium"
      >
        {OPTIONS.map((opt, i) => (
          <option key={i} value={i}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
