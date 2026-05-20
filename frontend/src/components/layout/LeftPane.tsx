import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSurnames } from '../../api/surnames'
import { useTreeStore } from '../../store/treeStore'
import SurnamePanel from '../surname/SurnamePanel'

export default function LeftPane() {
  const { t } = useTranslation('common')
  const { data: surnames = [], isLoading } = useSurnames()
  const loadFocalNode = useTreeStore(s => s.loadFocalNode)
  const navigate = useNavigate()

  function handleSurnameClick(treeId: string, recentPersonId?: string) {
    navigate('/')
    if (recentPersonId) {
      loadFocalNode(treeId, recentPersonId)
    }
  }

  return (
    <aside className="w-52 shrink-0 flex flex-col border-r bg-white overflow-y-auto">
      <div className="px-3 pt-3 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        {t('surnames')}
      </div>

      {isLoading && (
        <div className="px-3 py-2 text-sm text-gray-400">{t('loading')}</div>
      )}

      {surnames.map(s => (
        <SurnamePanel
          key={s.treeId}
          info={s}
          onClick={() => handleSurnameClick(s.treeId, s.recentPerson?.id)}
        />
      ))}

      <div className="mt-auto border-t">
        <Link
          to="/surnames"
          className="block px-3 py-2 text-xs text-blue-600 hover:bg-blue-50"
        >
          {t('surnameRelationships')} →
        </Link>
      </div>
    </aside>
  )
}
