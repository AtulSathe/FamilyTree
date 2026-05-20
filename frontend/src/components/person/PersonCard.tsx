import { useNavigate } from 'react-router-dom'
import type { Person } from '../../types/person'
import { Avatar } from '../common/Avatar'

interface PersonCardProps {
  person: Person
  surname?: string
}

export default function PersonCard({ person, surname }: PersonCardProps) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/person/${person.id}`)}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-200"
    >
      <Avatar src={person.photoBlobUrl} name={person.fullName} size={44} />
      <div className="min-w-0">
        <p className="font-medium text-gray-900 truncate">{person.fullName}</p>
        {surname && <p className="text-xs text-blue-600">{surname}</p>}
        {person.location && <p className="text-xs text-gray-500 truncate">{person.location}</p>}
        {person.birthMonthYear && <p className="text-xs text-gray-400">{person.birthMonthYear}</p>}
      </div>
    </div>
  )
}
