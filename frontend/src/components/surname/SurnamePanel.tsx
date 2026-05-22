import type { SurnameInfo } from '../../types/surname'

interface SurnamePanelProps {
  info: SurnameInfo
  onClick: () => void
  /** Render an inline "+" button. Caller provides the click handler. Hidden when omitted. */
  onAddPerson?: () => void
  addPersonLabel?: string
}

export default function SurnamePanel({ info, onClick, onAddPerson, addPersonLabel }: SurnamePanelProps) {
  return (
    <div className="group flex items-center w-full hover:bg-blue-50">
      <button
        type="button"
        onClick={onClick}
        className="flex-1 min-w-0 text-left px-3 py-2 flex items-center justify-between"
      >
        <span className="text-sm font-medium text-gray-800 group-hover:text-blue-700 truncate">
          {info.surname}
        </span>
        <span className="text-xs text-gray-400 ml-2 shrink-0">{info.memberCount}</span>
      </button>
      {onAddPerson && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onAddPerson() }}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 mr-1 w-6 h-6 flex items-center justify-center rounded text-green-600 hover:bg-green-100 text-base leading-none transition-opacity focus:outline-none focus:ring-2 focus:ring-green-400"
          aria-label={addPersonLabel}
          title={addPersonLabel}
        >
          ＋
        </button>
      )}
    </div>
  )
}
