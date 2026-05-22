import { useState } from 'react'
import { ReactFlow, MiniMap, Controls, Background, BackgroundVariant, Panel, type NodeMouseHandler } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useTranslation } from 'react-i18next'
import { useTreeStore } from '../../store/treeStore'
import { PersonNode } from './PersonNode'
import { edgeTypes } from './EdgeTypes'
import AddRelationModal from './AddRelationModal'
import RemoveRelationModal from './RemoveRelationModal'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import PersonForm from '../person/PersonForm'
import { useDeletePerson } from '../../api/persons'
import { useRemovePersonFromTree } from '../../api/trees'
import { useSurnames } from '../../api/surnames'
import { useAuth } from '../../hooks/useAuth'
import MembersListDrawer from '../members/MembersListDrawer'

const nodeTypes = { person: PersonNode }

export default function TreeCanvas() {
  const {
    nodes, edges, loading,
    onNodesChange, onEdgesChange,
    addRelationTarget, removeRelationTarget,
    activeFamilyTreeId, selectedNodeId,
    setSelectedNodeId, removePersonFromCanvas,
    loadFocalNode,
    error, clearError,
  } = useTreeStore()

  const { canEditTree, isPowerAdmin } = useAuth()
  const { t } = useTranslation('tree')
  const { t: tCommon } = useTranslation('common')
  const { data: surnames = [] } = useSurnames()
  const canEditActiveTree = !!activeFamilyTreeId && canEditTree(activeFamilyTreeId)
  const activeSurname = activeFamilyTreeId
    ? surnames.find(s => s.treeId === activeFamilyTreeId)?.surname
    : undefined
  const [showAddPerson, setShowAddPerson] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showRemoveFromTreeConfirm, setShowRemoveFromTreeConfirm] = useState(false)
  const [removeFromTreeError, setRemoveFromTreeError] = useState('')
  const [showMembers, setShowMembers] = useState(false)

  const selectedNode = nodes.find(n => n.id === selectedNodeId)
  const selectedName = (selectedNode?.data as { fullName?: string })?.fullName ?? ''

  const deleteMutation = useDeletePerson(selectedNodeId ?? '')
  const removeFromTreeMutation = useRemovePersonFromTree(activeFamilyTreeId ?? '')

  const onNodeClick: NodeMouseHandler = (_, node) => setSelectedNodeId(node.id)
  const onPaneClick = () => setSelectedNodeId(null)

  async function handleDeleteConfirm() {
    if (!selectedNodeId) return
    await deleteMutation.mutateAsync()
    removePersonFromCanvas(selectedNodeId)
    setShowDeleteConfirm(false)
  }

  async function handleRemoveFromTreeConfirm() {
    if (!selectedNodeId || !activeFamilyTreeId) return
    setRemoveFromTreeError('')
    try {
      await removeFromTreeMutation.mutateAsync(selectedNodeId)
      removePersonFromCanvas(selectedNodeId)
      setShowRemoveFromTreeConfirm(false)
    } catch {
      setRemoveFromTreeError(t('failedToRemoveFromTree'))
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        <span className="text-sm">{t('loadingTree')}</span>
      </div>
    )
  }

  if (nodes.length === 0) {
    const isEmptyActiveTree = !!activeFamilyTreeId && !error
    return (
      <div className="flex h-full w-full">
        <div className="flex-1 relative flex items-center justify-center flex-col gap-3 text-gray-400">
          <span className="text-5xl">🌳</span>
          <p className="text-sm">
            {error
              ? t(error.i18nKey)
              : isEmptyActiveTree && activeSurname
                ? t('emptyTreePrompt', { surname: activeSurname })
                : t('noTreeSelectedLong')}
          </p>
          {error && (
            <button
              type="button"
              onClick={clearError}
              className="text-xs text-blue-600 hover:underline"
            >
              {tCommon('retry')}
            </button>
          )}
          {isEmptyActiveTree && canEditActiveTree && (
            <button
              type="button"
              onClick={() => setShowAddPerson(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <span className="text-base leading-none">＋</span>
              {activeSurname
                ? t('addFirstPersonTo', { surname: activeSurname })
                : t('addPerson')}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowMembers(s => !s)}
            className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
            title={showMembers ? t('hideAllMembers') : t('showAllMembers')}
          >
            <span className="text-base leading-none">☰</span> {t('allMembers')}
          </button>
        </div>
        <MembersListDrawer open={showMembers} onClose={() => setShowMembers(false)} />
        {showAddPerson && activeFamilyTreeId && (
          <Modal open title={t('addNewPerson')} onClose={() => setShowAddPerson(false)}>
            <PersonForm
              defaultTreeId={activeFamilyTreeId}
              hideTrees
              onSuccess={(created) => {
                setShowAddPerson(false)
                if (created && activeFamilyTreeId) {
                  loadFocalNode(activeFamilyTreeId, created.id)
                }
              }}
              onCancel={() => setShowAddPerson(false)}
            />
          </Modal>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full w-full">
      <div className="flex-1 relative">
      {error && (
        <div
          role="alert"
          className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg shadow px-4 py-2 flex items-center gap-3"
        >
          <span>{t(error.i18nKey)}</span>
          <button
            type="button"
            onClick={clearError}
            className="text-red-500 hover:text-red-700 font-bold text-base leading-none"
            aria-label={tCommon('close')}
          >
            ×
          </button>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={2}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d1d5db" />
        <MiniMap nodeStrokeWidth={3} zoomable pannable />
        <Controls />

        {/* Floating action panel */}
        <Panel position="top-right">
          <div className="flex flex-col gap-2 bg-white rounded-xl shadow-lg border border-gray-200 p-2">
            <button
              type="button"
              onClick={() => setShowMembers(s => !s)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                showMembers
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
              }`}
              title={showMembers ? t('hideAllMembers') : t('showAllMembers')}
              aria-pressed={showMembers}
            >
              <span className="text-base leading-none">☰</span> {t('allMembers')}
            </button>

            {canEditActiveTree && (
              <>
                <button
                  type="button"
                  onClick={() => setShowAddPerson(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium transition-colors"
                  title={t('addPersonTooltip')}
                >
                  <span className="text-base leading-none">＋</span> {t('addPerson')}
                </button>

                {isPowerAdmin ? (
                <button
                  type="button"
                  onClick={() => selectedNodeId && setShowDeleteConfirm(true)}
                  disabled={!selectedNodeId}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title={selectedNodeId ? `${tCommon('delete')} ${selectedName}` : t('deleteSelectFirst')}
                >
                  <span className="text-base leading-none">🗑</span>
                  {selectedNodeId
                    ? `${tCommon('delete')} ${selectedName}`
                    : t('deleteSelectNode')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => selectedNodeId && setShowRemoveFromTreeConfirm(true)}
                  disabled={!selectedNodeId}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title={selectedNodeId ? `${t('removeFromTree')} – ${selectedName}` : t('deleteSelectFirst')}
                >
                  <span className="text-base leading-none">↗</span>
                  {selectedNodeId
                    ? `${t('removeFromTree')} – ${selectedName}`
                    : t('removeFromTreeSelectNode')}
                </button>
              )}
              </>
            )}
          </div>
        </Panel>
      </ReactFlow>

      {/* Add relation modal */}
      {addRelationTarget && activeFamilyTreeId && (
        <AddRelationModal focalPersonId={addRelationTarget} treeId={activeFamilyTreeId} />
      )}

      {/* Remove relation modal */}
      {removeRelationTarget && activeFamilyTreeId && (
        <RemoveRelationModal focalPersonId={removeRelationTarget} treeId={activeFamilyTreeId} />
      )}

      {/* Add person (standalone) modal */}
      {showAddPerson && activeFamilyTreeId && (
        <Modal open title={t('addNewPerson')} onClose={() => setShowAddPerson(false)}>
          <PersonForm
            defaultTreeId={activeFamilyTreeId}
            hideTrees
            onSuccess={() => setShowAddPerson(false)}
            onCancel={() => setShowAddPerson(false)}
          />
        </Modal>
      )}

      {/* Delete person confirmation modal */}
      {showDeleteConfirm && selectedNodeId && (
        <Modal open title={t('deletePerson')} onClose={() => setShowDeleteConfirm(false)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              {t('deletePersonPrompt', { name: selectedName })}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>{tCommon('cancel')}</Button>
              <Button
                variant="danger"
                loading={deleteMutation.isPending}
                onClick={handleDeleteConfirm}
              >
                {tCommon('delete')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Remove-from-tree confirmation modal (Family Admin) */}
      {showRemoveFromTreeConfirm && selectedNodeId && (
        <Modal
          open
          title={t('removeFromTreeTitle')}
          onClose={() => { setShowRemoveFromTreeConfirm(false); setRemoveFromTreeError('') }}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              {t('removeFromTreePrompt', { name: selectedName })}
            </p>
            {removeFromTreeError && (
              <p className="text-xs text-red-500">{removeFromTreeError}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => { setShowRemoveFromTreeConfirm(false); setRemoveFromTreeError('') }}
              >
                {tCommon('cancel')}
              </Button>
              <Button
                variant="danger"
                loading={removeFromTreeMutation.isPending}
                onClick={handleRemoveFromTreeConfirm}
              >
                {t('removeFromTree')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
      </div>
      <MembersListDrawer open={showMembers} onClose={() => setShowMembers(false)} />
    </div>
  )
}
