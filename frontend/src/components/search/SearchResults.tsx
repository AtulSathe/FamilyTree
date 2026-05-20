import { useNavigate } from 'react-router-dom'
import type { SearchResult } from '../../types/search'
import { Avatar } from '../common/Avatar'
import { Badge } from '../common/Badge'

interface SearchResultsProps {
  results: SearchResult[]
  onClose: () => void
}

export default function SearchResults({ results, onClose }: SearchResultsProps) {
  const navigate = useNavigate()

  function go(personId: string) {
    navigate(`/person/${personId}`)
    onClose()
  }

  return (
    <ul className="absolute z-40 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
      {results.map(r => (
        <li key={r.personId}>
          <button
            onMouseDown={() => go(r.personId)}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left"
          >
            <Avatar src={null} name={r.fullName} size={32} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{r.fullName}</p>
              <p className="text-xs text-gray-500 truncate">{r.location ?? r.birthMonthYear ?? ''}</p>
            </div>
            <Badge label={r.surname} color="blue" />
          </button>
        </li>
      ))}
    </ul>
  )
}
