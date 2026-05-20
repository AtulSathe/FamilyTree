type Color = 'blue' | 'green' | 'amber' | 'purple' | 'red' | 'gray'

interface BadgeProps {
  label: string
  color?: Color
}

const colors: Record<Color, string> = {
  blue:   'bg-blue-100 text-blue-700',
  green:  'bg-green-100 text-green-700',
  amber:  'bg-amber-100 text-amber-700',
  purple: 'bg-purple-100 text-purple-700',
  red:    'bg-red-100 text-red-700',
  gray:   'bg-gray-100 text-gray-600',
}

const relColors: Record<string, Color> = {
  spouse:              'amber',
  parent_of:           'green',
  child_of:            'green',
  sibling_of:          'purple',
  in_law_of:           'blue',
  step_parent_of:      'blue',
  adoptive_parent_of:  'blue',
  power_admin:         'red',
  family_admin:        'blue',
  community_member:    'gray',
}

export function Badge({ label, color }: BadgeProps) {
  const c = color ?? relColors[label] ?? 'gray'
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colors[c]}`}>
      {label.replace(/_/g, ' ')}
    </span>
  )
}
