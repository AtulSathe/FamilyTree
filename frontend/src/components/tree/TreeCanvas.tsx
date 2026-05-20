import { useState } from 'react'
import { ReactFlow, MiniMap, Controls, Background, BackgroundVariant, Panel, type NodeMouseHandler } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useTreeStore } from '../../store/treeStore'
import { PersonNode } from './PersonNode'
import { edgeTypes } from './EdgeTypes'
import AddRelationModal from './AddRelationModal'
import RemoveRelationModal from './RemoveRelationModal'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import PersonForm from '../person/PersonForm'
import { useDeletePerson } from '../../api/persons'
import { useAuth } from '../../hooks/useAuth'

const nodeTypes = { person: PersonNode }

export default function TreeCanvas() {
  const {
    nodes, edges, loading,
    onNodesChange, onEdgesChange,
    addRelationTarget, removeRelationTarget,
    activeFamilyTreeId, selectedNodeId,
    setSelectedNodeId, removePersonFromCanvas,
  } = useTreeStore()

  const { canEdit, isPowerAdmin } = useAuth()
  const [showAddPerson, setShowAddPerson] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const selectedNode = nodes.find(n => n.id === selectedNodeId)
  const selectedName = (selectedNode?.data as { fullName?: string })?.fullName ?? ''

  const deleteMutation = useDeletePerson(selectedNodeId ?? '')

  const onNodeClick: NodeMouseHandler = (_, node) => setSelectedNodeId(node.id)
  const onPaneClick = () => setSelectedNodeId(null)

  async function handleDeleteConfirm() {
    if (!selectedNodeId) return
    await deleteMutation.mutateAsync()
    removePersonFromCanvas(selectedNodeId)
    setShowDeleteConfirm(false)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        <span className="text-sm">Loading tree…</span>
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center flex-col gap-3 text-gray-400">
        <span className="text-5xl">🌳</span>
        <p className="text-sm">Select a surname from the left pane to view the family tree.</p>
      </div>
    )
  }

  return (
    <>
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
        {canEdit && (
          <Panel position="top-right">
            <div className="flex flex-col gap-2 bg-white rounded-xl shadow-lg border border-gray-200 p-2">
              <button
                onClick={() => setShowAddPerson(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium transition-colors"
                title="Add a new person to this tree"
              >
                <span className="text-base leading-none">＋</span> Add Person
              </button>

              {isPowerAdmin && (
                <button
                  onClick={() => selectedNodeId && setShowDeleteConfirm(true)}
                  disabled={!selectedNodeId}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title={selectedNodeId ? `Delete ${selectedName}` : 'Click a node first'}
                >
                  <span className="text-base leading-none">🗑</span>
                  {selectedNodeId ? `Delete ${selectedName}` : 'Delete (select node)'}
                </button>
              )}
            </div>
          </Panel>
        )}
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
        <Modal open title="Add New Person" onClose={() => setShowAddPerson(false)}>
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
        <Modal open title="Delete Person" onClose={() => setShowDeleteConfirm(false)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Permanently delete <span className="font-semibold">{selectedName}</span>? This removes the person from all trees and cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              <Button
                variant="danger"
                loading={deleteMutation.isPending}
                onClick={handleDeleteConfirm}
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
