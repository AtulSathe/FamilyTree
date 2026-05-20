import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSurnameLinks } from '../../api/surnames'
import { Badge } from '../common/Badge'

export default function SurnameRelationships() {
  const { t } = useTranslation('common')
  const { data: links = [], isLoading } = useSurnameLinks()

  if (isLoading) return <p className="text-gray-400 text-sm p-4">{t('loading')}</p>

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['Surname A', 'Surname B', 'Link Person', 'Hops', 'Detected'].map(h => (
              <th
                key={h}
                className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {links.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                No cross-tree links detected yet.
              </td>
            </tr>
          )}
          {links.map((l, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-4 py-2"><Badge label={l.surnameA} color="blue" /></td>
              <td className="px-4 py-2"><Badge label={l.surnameB} color="green" /></td>
              <td className="px-4 py-2">
                <Link
                  to={`/person/${l.linkPerson.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {l.linkPerson.fullName}
                </Link>
              </td>
              <td className="px-4 py-2 font-mono text-gray-700">{l.relationshipLevel}</td>
              <td className="px-4 py-2 text-gray-400">
                {new Date(l.detectedAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
