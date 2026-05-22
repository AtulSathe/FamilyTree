import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { TreeNode } from '../types/tree'

vi.mock('../api/client', () => ({
  api: {
    get: vi.fn(),
  },
}))

import { api } from '../api/client'
import { useTreeStore } from './treeStore'

const TREE = 'tree-1'
const FOCAL = 'p-focal'
const PARENT = 'p-parent'
const CHILD = 'p-child'
const SPOUSE = 'p-spouse'

function makeResponse(personId: string, relations: TreeNode['relations']): { data: TreeNode } {
  return {
    data: {
      person: {
        id: personId,
        fullName: personId,
        nameBefore: null,
        phone: null,
        location: null,
        birthMonthYear: null,
        deathMonthYear: null,
        photoBlobUrl: null,
        primaryTreeId: TREE,
      },
      relations,
    },
  }
}

describe('treeStore expand / collapse', () => {
  beforeEach(() => {
    useTreeStore.getState().clearTree()
    vi.mocked(api.get).mockReset()
  })

  it('loadFocalNode populates nodes and resets expandedPersonIds', async () => {
    vi.mocked(api.get).mockResolvedValueOnce(makeResponse(FOCAL, [
      { personId: PARENT, fullName: 'Parent', photoBlobUrl: null, location: null, birthMonthYear: null, deathMonthYear: null, relationshipType: 'parent_of', direction: 'in' },
    ]))

    await useTreeStore.getState().loadFocalNode(TREE, FOCAL)
    const s = useTreeStore.getState()
    expect(s.nodes.map(n => n.id).sort()).toEqual([FOCAL, PARENT].sort())
    expect(s.expandedPersonIds.size).toBe(0)
    expect(s.activeFamilyTreeId).toBe(TREE)
  })

  it('expandNode adds nodes and records the diff', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce(makeResponse(FOCAL, []))
      .mockResolvedValueOnce(makeResponse(FOCAL, [
        { personId: CHILD,  fullName: 'C', photoBlobUrl: null, location: null, birthMonthYear: null, deathMonthYear: null, relationshipType: 'parent_of', direction: 'out' },
        { personId: SPOUSE, fullName: 'S', photoBlobUrl: null, location: null, birthMonthYear: null, deathMonthYear: null, relationshipType: 'spouse',    direction: 'both' },
      ]))

    await useTreeStore.getState().loadFocalNode(TREE, FOCAL)
    await useTreeStore.getState().expandNode(FOCAL)

    const s = useTreeStore.getState()
    expect(s.nodes.map(n => n.id).sort()).toEqual([FOCAL, CHILD, SPOUSE].sort())
    expect(s.expandedPersonIds.has(FOCAL)).toBe(true)
    expect(s.expansionDiffs[FOCAL].nodeIds.sort()).toEqual([CHILD, SPOUSE].sort())
  })

  it('collapseNode removes only the nodes/edges added by that expansion', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce(makeResponse(FOCAL, []))
      .mockResolvedValueOnce(makeResponse(FOCAL, [
        { personId: CHILD,  fullName: 'C', photoBlobUrl: null, location: null, birthMonthYear: null, deathMonthYear: null, relationshipType: 'parent_of', direction: 'out' },
        { personId: SPOUSE, fullName: 'S', photoBlobUrl: null, location: null, birthMonthYear: null, deathMonthYear: null, relationshipType: 'spouse',    direction: 'both' },
      ]))

    await useTreeStore.getState().loadFocalNode(TREE, FOCAL)
    await useTreeStore.getState().expandNode(FOCAL)
    useTreeStore.getState().collapseNode(FOCAL)

    const s = useTreeStore.getState()
    expect(s.nodes.map(n => n.id)).toEqual([FOCAL])
    expect(s.edges).toEqual([])
    expect(s.expandedPersonIds.has(FOCAL)).toBe(false)
    expect(s.expansionDiffs[FOCAL]).toBeUndefined()
  })

  it('expandNode does nothing when no tree is active', async () => {
    await useTreeStore.getState().expandNode(FOCAL)
    expect(api.get).not.toHaveBeenCalled()
  })
})
