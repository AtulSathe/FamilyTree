import type { SurnameInfo } from '../../types/surname'

interface SurnamePanelProps {
  info: SurnameInfo
  onClick: () => void
}

export default function SurnamePanel({ info, onClick }: SurnamePanelProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between group"
    >
      <span className="text-sm font-medium text-gray-800 group-hover:text-blue-700">
        {info.surname}
      </span>
      <span className="text-xs text-gray-400">{info.memberCount}</span>
    </button>
  )
}
