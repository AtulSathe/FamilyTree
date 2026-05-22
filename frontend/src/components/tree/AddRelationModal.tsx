import { useState } from 'react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import PersonForm from '../person/PersonForm'
import { useAddRelationship } from '../../api/trees'
import { useSearchExisting } from '../../api/persons'
import { useTreeStore } from '../../store/treeStore'
import type { Person } from '../../types/person'
import type { CreateRelationshipPayload } from '../../types/tree'

export type RelType =
  | 'parent'
  | 'child'
  | 'spouse'
  | 'sibling'
  | 'in_law'
  | 'step_parent'
  | 'adoptive'
type Tab = 'create' | 'link'

interface Props {
  focalPersonId: string
  treeId: string
}

export function buildPayload(
  relType: RelType,
  focalPersonId: string,
  otherPersonId: string,
): CreateRelationshipPayload {
  switch (relType) {
    case 'parent':
      return { personAId: otherPersonId, personBId: focalPersonId, relationshipType: 'parent_of' }
    case 'child':
      return { personAId: focalPersonId, personBId: otherPersonId, relationshipType: 'parent_of' }
    case 'spouse':
      return { personAId: focalPersonId, personBId: otherPersonId, relationshipType: 'spouse' }
    case 'sibling':
      return { personAId: focalPersonId, personBId: otherPersonId, relationshipType: 'sibling_of' }
    case 'in_law':
      return { personAId: focalPersonId, personBId: otherPersonId, relationshipType: 'in_law_of' }
    case 'step_parent':
      return { personAId: otherPersonId, personBId: focalPersonId, relationshipType: 'step_parent_of' }
    case 'adoptive':
      return { personAId: otherPersonId, personBId: focalPersonId, relationshipType: 'adoptive_parent_of' }
  }
}

export default function AddRelationModal({ focalPersonId, treeId }: Props) {
  const { setAddRelationTarget, expandNode } = useTreeStore()
  const [relType, setRelType] = useState<RelType>('child')
  const [tab, setTab] = useState<Tab>('create')
  const [searchQ, setSearchQ] = useState('')
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [linkError, setLinkError] = useState('')

  const addRelationship = useAddRelationship(treeId)
  const { data: searchResults = [], isFetching: searching } = useSearchExisting(searchQ)

  function close() { setAddRelationTarget(null) }

  async function handleCreated(created?: Person) {
    if (!created) return
    try {
      await addRelationship.mutateAsync(buildPayload(relType, focalPersonId, created.id))
      await expandNode(focalPersonId)
      close()
    } catch {
      // error handled by mutation state
    }
  }

  async function handleLink() {
    if (!selectedPerson) { setLinkError('Select a person first'); return }
    setLinkError('')
    try {
      await addRelationship.mutateAsync(buildPayload(relType, focalPersonId, selectedPerson.id))
      await expandNode(focalPersonId)
      close()
    } catch {
      setLinkError('Failed to add relationship')
    }
  }

  const relLabels: Record<RelType, string> = {
    parent: 'Parent (they are parent of focal person)',
    child: 'Child (focal person is parent)',
    spouse: 'Spouse',
    sibling: 'Sibling',
    in_law: 'In-Law',
    step_parent: 'Step-Parent (they are step-parent of focal person)',
    adoptive: 'Adoptive Parent (they are adoptive parent of focal person)',
  }

  return (
    <Modal open title="Add Relation" onClose={close}>
      <div className="space-y-4">
        {/* Relationship type */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Relationship type</label>
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={relType}
            onChange={e => setRelType(e.target.value as RelType)}
          >
            {(Object.keys(relLabels) as RelType[]).map(k => (
              <option key={k} value={k}>{relLabels[k]}</option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {(['create', 'link'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'create' ? 'Create New' : 'Link Existing'}
            </button>
          ))}
        </div>

        {tab === 'create' && (
          <PersonForm
            defaultTreeId={treeId}
            hideTrees
            onSuccess={handleCreated}
            onCancel={close}
          />
        )}

        {tab === 'link' && (
          <div className="space-y-3">
            <input
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Search by name…"
              value={searchQ}
              onChange={e => { setSearchQ(e.target.value); setSelectedPerson(null) }}
            />

            {searching && <p className="text-xs text-gray-400">Searching…</p>}

            {searchResults.length > 0 && (
              <ul className="border border-gray-200 rounded-md divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {searchResults.map(p => (
                  <li key={p.id}>
                    <button
                      onClick={() => { setSelectedPerson(p); setSearchQ(p.fullName) }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        selectedPerson?.id === p.id ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-800'
                      }`}
                    >
                      {p.fullName}
                      {p.birthMonthYear && (
                        <span className="ml-2 text-xs text-gray-400">{p.birthMonthYear}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {linkError && <p className="text-xs text-red-500">{linkError}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" onClick={close}>Cancel</Button>
              <Button
                onClick={handleLink}
                loading={addRelationship.isPending}
                disabled={!selectedPerson}
              >
                Link Person
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
