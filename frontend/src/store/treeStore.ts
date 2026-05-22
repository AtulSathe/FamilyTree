import { create } from 'zustand'
import {
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react'
import { api } from '../api/client'
import type { TreeNode, RelationDto } from '../types/tree'

export interface PersonNodeData extends Record<string, unknown> {
  personId: string
  fullName: string
  photoBlobUrl: string | null
  location: string | null
  birthMonthYear: string | null
  deathMonthYear: string | null
  isCenter: boolean
}

const H_GAP = 220
const V_GAP = 180

function relToNode(
  rel: RelationDto,
  position: { x: number; y: number },
): Node<PersonNodeData> {
  return {
    id: rel.personId,
    type: 'person',
    position,
    data: {
      personId: rel.personId,
      fullName: rel.fullName,
      photoBlobUrl: rel.photoBlobUrl,
      location: rel.location,
      birthMonthYear: rel.birthMonthYear,
      deathMonthYear: rel.deathMonthYear,
      isCenter: false,
    },
  }
}

function buildLayout(
  treeNode: TreeNode,
  cx: number,
  cy: number,
  knownIds: Set<string>,
): { newNodes: Node<PersonNodeData>[]; newEdges: Edge[] } {
  const { person, relations } = treeNode
  const newNodes: Node<PersonNodeData>[] = []
  const newEdges: Edge[] = []

  const VERTICAL_TYPES = ['parent_of', 'step_parent_of', 'adoptive_parent_of']
  const parents  = relations.filter(r => VERTICAL_TYPES.includes(r.relationshipType) && r.direction === 'in')
  const children = relations.filter(r => VERTICAL_TYPES.includes(r.relationshipType) && r.direction === 'out')
  const spouses  = relations.filter(r => r.relationshipType === 'spouse')
  const inLaws   = relations.filter(r => r.relationshipType === 'in_law_of')
  const siblings = relations.filter(r => r.relationshipType === 'sibling_of')

  const edgeStyleFor = (rt: string): { stroke: string; dasharray?: string } => {
    switch (rt) {
      case 'step_parent_of':     return { stroke: '#0ea5e9', dasharray: '6 3' }
      case 'adoptive_parent_of': return { stroke: '#ec4899', dasharray: '2 3' }
      default:                   return { stroke: '#10b981' }
    }
  }

  // Centre node
  if (!knownIds.has(person.id)) {
    newNodes.push({
      id: person.id,
      type: 'person',
      position: { x: cx, y: cy },
      data: {
        personId: person.id,
        fullName: person.fullName,
        photoBlobUrl: person.photoBlobUrl,
        location: person.location,
        birthMonthYear: person.birthMonthYear,
        deathMonthYear: person.deathMonthYear,
        isCenter: true,
      },
    })
    knownIds.add(person.id)
  }

  const place = (rels: RelationDto[], baseY: number, xOffset: (i: number) => number) =>
    rels.forEach((rel, i) => {
      if (!knownIds.has(rel.personId)) {
        newNodes.push(relToNode(rel, { x: cx + xOffset(i), y: baseY }))
        knownIds.add(rel.personId)
      }
    })

  place(parents,  cy - V_GAP, i => (i - (parents.length  - 1) / 2) * H_GAP)
  place(children, cy + V_GAP, i => (i - (children.length - 1) / 2) * H_GAP)

  spouses.forEach((rel, i) => {
    if (!knownIds.has(rel.personId)) {
      newNodes.push(relToNode(rel, { x: cx + H_GAP * (i + 1), y: cy }))
      knownIds.add(rel.personId)
    }
    newEdges.push({
      id: `e-sp-${person.id}-${rel.personId}`,
      source: person.id,
      target: rel.personId,
      type: 'straight',
      style: { stroke: '#f59e0b', strokeDasharray: '5 5', strokeWidth: 2 },
      label: 'spouse',
    })
  })

  inLaws.forEach((rel, i) => {
    if (!knownIds.has(rel.personId)) {
      newNodes.push(relToNode(rel, { x: cx + H_GAP * (spouses.length + i + 1), y: cy + V_GAP / 2 }))
      knownIds.add(rel.personId)
    }
    newEdges.push({
      id: `e-il-${person.id}-${rel.personId}`,
      source: person.id,
      target: rel.personId,
      type: 'straight',
      style: { stroke: '#a855f7', strokeDasharray: '3 3', strokeWidth: 2 },
      label: 'in-law',
    })
  })

  siblings.forEach((rel, i) => {
    if (!knownIds.has(rel.personId)) {
      newNodes.push(relToNode(rel, { x: cx - H_GAP * (i + 1), y: cy }))
      knownIds.add(rel.personId)
    }
    newEdges.push({
      id: `e-sib-${person.id}-${rel.personId}`,
      source: person.id,
      target: rel.personId,
      type: 'straight',
      style: { stroke: '#8b5cf6', strokeDasharray: '4 4', strokeWidth: 2 },
      label: 'sibling',
    })
  })

  parents.forEach(rel => {
    const { stroke, dasharray } = edgeStyleFor(rel.relationshipType)
    newEdges.push({
      id: `e-par-${rel.personId}-${person.id}-${rel.relationshipType}`,
      source: rel.personId,
      target: person.id,
      type: 'smoothstep',
      style: { stroke, strokeWidth: 2, ...(dasharray && { strokeDasharray: dasharray }) },
    })
  })

  children.forEach(rel => {
    const { stroke, dasharray } = edgeStyleFor(rel.relationshipType)
    newEdges.push({
      id: `e-ch-${person.id}-${rel.personId}-${rel.relationshipType}`,
      source: person.id,
      target: rel.personId,
      type: 'smoothstep',
      style: { stroke, strokeWidth: 2, ...(dasharray && { strokeDasharray: dasharray }) },
    })
  })

  return { newNodes, newEdges }
}

interface ExpansionDiff {
  nodeIds: string[]
  edgeIds: string[]
}

interface TreeStore {
  activeFamilyTreeId: string | null
  nodes: Node<PersonNodeData>[]
  edges: Edge[]
  loading: boolean
  addRelationTarget: string | null
  removeRelationTarget: string | null
  selectedNodeId: string | null
  expandedPersonIds: Set<string>
  expansionDiffs: Record<string, ExpansionDiff>
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  loadFocalNode: (treeId: string, personId: string) => Promise<void>
  expandNode: (personId: string, levels?: number) => Promise<void>
  collapseNode: (personId: string) => void
  clearTree: () => void
  setAddRelationTarget: (personId: string | null) => void
  setRemoveRelationTarget: (personId: string | null) => void
  setSelectedNodeId: (id: string | null) => void
  removeRelationFromCanvas: (personAId: string, personBId: string) => void
  removePersonFromCanvas: (personId: string) => void
}

export const useTreeStore = create<TreeStore>((set, get) => ({
  activeFamilyTreeId: null,
  nodes: [],
  edges: [],
  loading: false,
  addRelationTarget: null,
  removeRelationTarget: null,
  selectedNodeId: null,
  expandedPersonIds: new Set(),
  expansionDiffs: {},

  onNodesChange: changes =>
    set(s => ({ nodes: applyNodeChanges(changes, s.nodes) as Node<PersonNodeData>[] })),

  onEdgesChange: changes =>
    set(s => ({ edges: applyEdgeChanges(changes, s.edges) })),

  loadFocalNode: async (treeId, personId) => {
    set({
      loading: true,
      activeFamilyTreeId: treeId,
      nodes: [],
      edges: [],
      expandedPersonIds: new Set(),
      expansionDiffs: {},
    })
    try {
      const { data } = await api.get<TreeNode>(`/trees/${treeId}/node/${personId}?levels=1`)
      const { newNodes, newEdges } = buildLayout(data, 400, 300, new Set())
      set({ nodes: newNodes, edges: newEdges, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  expandNode: async (personId, levels = 1) => {
    const treeId = get().activeFamilyTreeId
    if (!treeId) return
    const knownIds = new Set(get().nodes.map(n => n.id))
    const centerNode = get().nodes.find(n => n.id === personId)
    const cx = centerNode?.position.x ?? 400
    const cy = centerNode?.position.y ?? 300
    try {
      const { data } = await api.get<TreeNode>(
        `/trees/${treeId}/node/${personId}?levels=${levels}`,
      )
      const { newNodes, newEdges } = buildLayout(data, cx, cy, knownIds)
      set(s => {
        const trulyNewEdges = newEdges.filter(ne => !s.edges.some(e => e.id === ne.id))
        const nextExpanded = new Set(s.expandedPersonIds)
        nextExpanded.add(personId)
        return {
          nodes: [...s.nodes, ...newNodes],
          edges: [
            ...s.edges.filter(e => !newEdges.some(ne => ne.id === e.id)),
            ...newEdges,
          ],
          expandedPersonIds: nextExpanded,
          expansionDiffs: {
            ...s.expansionDiffs,
            [personId]: {
              nodeIds: newNodes.map(n => n.id),
              edgeIds: trulyNewEdges.map(e => e.id),
            },
          },
        }
      })
    } catch {
      // silently ignore expand errors
    }
  },

  collapseNode: (personId) =>
    set(s => {
      const diff = s.expansionDiffs[personId]
      if (!diff) return s
      const remainingDiffs: Record<string, ExpansionDiff> = { ...s.expansionDiffs }
      delete remainingDiffs[personId]
      const keepNodeIds = new Set<string>()
      const keepEdgeIds = new Set<string>()
      Object.values(remainingDiffs).forEach(d => {
        d.nodeIds.forEach(id => keepNodeIds.add(id))
        d.edgeIds.forEach(id => keepEdgeIds.add(id))
      })
      const removeNodeIds = new Set(diff.nodeIds.filter(id => !keepNodeIds.has(id)))
      const removeEdgeIds = new Set(diff.edgeIds.filter(id => !keepEdgeIds.has(id)))
      const nextExpanded = new Set(s.expandedPersonIds)
      nextExpanded.delete(personId)
      return {
        nodes: s.nodes.filter(n => !removeNodeIds.has(n.id)),
        edges: s.edges.filter(
          e => !removeEdgeIds.has(e.id) &&
               !removeNodeIds.has(e.source) &&
               !removeNodeIds.has(e.target),
        ),
        expandedPersonIds: nextExpanded,
        expansionDiffs: remainingDiffs,
        selectedNodeId: s.selectedNodeId && removeNodeIds.has(s.selectedNodeId)
          ? null
          : s.selectedNodeId,
      }
    }),

  clearTree: () => set({
    nodes: [],
    edges: [],
    activeFamilyTreeId: null,
    selectedNodeId: null,
    expandedPersonIds: new Set(),
    expansionDiffs: {},
  }),

  setAddRelationTarget: (personId) => set({ addRelationTarget: personId }),

  setRemoveRelationTarget: (personId) => set({ removeRelationTarget: personId }),

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  removeRelationFromCanvas: (personAId, personBId) =>
    set(s => ({
      edges: s.edges.filter(
        e => !(
          (e.source === personAId && e.target === personBId) ||
          (e.source === personBId && e.target === personAId)
        ),
      ),
    })),

  removePersonFromCanvas: (personId) =>
    set(s => ({
      nodes: s.nodes.filter(n => n.id !== personId),
      edges: s.edges.filter(e => e.source !== personId && e.target !== personId),
      selectedNodeId: s.selectedNodeId === personId ? null : s.selectedNodeId,
    })),
}))
