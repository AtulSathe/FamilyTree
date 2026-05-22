import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../common/Modal'
import { useTreeStore } from '../../store/treeStore'
import { useRemoveRelationship } from '../../api/trees'

interface Props {
  focalPersonId: string
  treeId: string
}

export default function RemoveRelationModal({ focalPersonId, treeId }: Props) {
  const { nodes, edges, setRemoveRelationTarget, removeRelationFromCanvas } = useTreeStore()
  const removeRel = useRemoveRelationship(treeId)
  const { t } = useTranslation('tree')
  const { t: tCommon } = useTranslation('common')
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState('')

  const relLabel = (edgeLabel: string | undefined): string =>
    edgeLabel ? String(edgeLabel) : t('parentOrChildLabel')

  // Find all edges that involve the focal person
  const connected = edges
    .filter(e => e.source === focalPersonId || e.target === focalPersonId)
    .map(e => {
      const otherId = e.source === focalPersonId ? e.target : e.source
      const otherNode = nodes.find(n => n.id === otherId)
      const otherName = (otherNode?.data as { fullName?: string })?.fullName ?? otherId
      return { edgeId: e.id, otherId, otherName, label: relLabel(e.label as string | undefined) }
    })

  async function handleRemove(otherId: string) {
    setRemoving(otherId)
    setError('')
    try {
      await removeRel.mutateAsync({ personAId: focalPersonId, personBId: otherId })
      removeRelationFromCanvas(focalPersonId, otherId)
    } catch {
      setError(t('failedToRemoveRelation'))
    } finally {
      setRemoving(null)
    }
  }

  const focalName = (nodes.find(n => n.id === focalPersonId)?.data as { fullName?: string })?.fullName ?? ''

  return (
    <Modal open title={t('removeRelationsTitle', { name: focalName })} onClose={() => setRemoveRelationTarget(null)}>
      <div className="space-y-3">
        {connected.length === 0 ? (
          <p className="text-sm text-gray-500">{t('noVisibleConnections')}</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {connected.map(({ otherId, otherName, label }) => (
              <li key={otherId} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <span className="font-medium text-gray-800">{otherName}</span>
                  <span className="ml-2 text-xs text-gray-400 capitalize">{label}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(otherId)}
                  disabled={removing === otherId}
                  className="ml-4 px-2.5 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium disabled:opacity-50 transition-colors"
                  aria-label={`${tCommon('remove')} – ${otherName}`}
                >
                  {removing === otherId ? '…' : tCommon('remove')}
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => setRemoveRelationTarget(null)}
            className="px-4 py-1.5 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
          >
            {tCommon('close')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
