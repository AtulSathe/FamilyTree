import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSurnames } from '../../api/surnames'
import { useTreeStore } from '../../store/treeStore'
import { useAuth } from '../../hooks/useAuth'
import SurnamePanel from '../surname/SurnamePanel'
import CreateSurnameModal from '../surname/CreateSurnameModal'
import { Modal } from '../common/Modal'
import PersonForm from '../person/PersonForm'

export default function LeftPane() {
  const { t } = useTranslation('common')
  const { t: tTree } = useTranslation('tree')
  const { data: surnames = [], isLoading } = useSurnames()
  const loadFocalNode = useTreeStore(s => s.loadFocalNode)
  const setActiveTreeEmpty = useTreeStore(s => s.setActiveTreeEmpty)
  const { isPowerAdmin, canEditTree } = useAuth()
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)
  const [addPersonForTreeId, setAddPersonForTreeId] = useState<string | null>(null)

  function handleSurnameClick(treeId: string, recentPersonId?: string) {
    navigate('/')
    if (recentPersonId) {
      loadFocalNode(treeId, recentPersonId)
    } else {
      // Empty tree — activate it so the canvas knows which tree to add into.
      setActiveTreeEmpty(treeId)
    }
  }

  function handleAddPerson(treeId: string) {
    navigate('/')
    setActiveTreeEmpty(treeId)
    setAddPersonForTreeId(treeId)
  }

  return (
    <aside className="w-52 shrink-0 flex flex-col border-r bg-white overflow-y-auto">
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {t('surnames')}
        </span>
        {isPowerAdmin && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="text-xs px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
            title={tTree('newSurname')}
          >
            + {tTree('newSurname')}
          </button>
        )}
      </div>

      {isLoading && (
        <div className="px-3 py-2 text-sm text-gray-400">{t('loading')}</div>
      )}

      {surnames.map(s => (
        <SurnamePanel
          key={s.treeId}
          info={s}
          onClick={() => handleSurnameClick(s.treeId, s.recentPerson?.id)}
          onAddPerson={canEditTree(s.treeId) ? () => handleAddPerson(s.treeId) : undefined}
          addPersonLabel={tTree('addPersonToSurname', { surname: s.surname })}
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

      <CreateSurnameModal open={showCreate} onClose={() => setShowCreate(false)} />

      {addPersonForTreeId && (
        <Modal open title={tTree('addNewPerson')} onClose={() => setAddPersonForTreeId(null)}>
          <PersonForm
            defaultTreeId={addPersonForTreeId}
            hideTrees
            onSuccess={(created) => {
              const treeId = addPersonForTreeId
              setAddPersonForTreeId(null)
              if (created && treeId) loadFocalNode(treeId, created.id)
            }}
            onCancel={() => setAddPersonForTreeId(null)}
          />
        </Modal>
      )}
    </aside>
  )
}
