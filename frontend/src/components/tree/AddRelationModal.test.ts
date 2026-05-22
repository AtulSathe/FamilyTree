import { describe, it, expect } from 'vitest'
import { buildPayload, type RelType } from './AddRelationModal'

const FOCAL = 'focal-id'
const OTHER = 'other-id'

describe('AddRelationModal.buildPayload', () => {
  it('maps all 7 relationship types to backend types with correct directionality', () => {
    const cases: Record<RelType, { aId: string; bId: string; rt: string }> = {
      parent:      { aId: OTHER, bId: FOCAL, rt: 'parent_of' },
      child:       { aId: FOCAL, bId: OTHER, rt: 'parent_of' },
      spouse:      { aId: FOCAL, bId: OTHER, rt: 'spouse' },
      sibling:     { aId: FOCAL, bId: OTHER, rt: 'sibling_of' },
      in_law:      { aId: FOCAL, bId: OTHER, rt: 'in_law_of' },
      step_parent: { aId: OTHER, bId: FOCAL, rt: 'step_parent_of' },
      adoptive:    { aId: OTHER, bId: FOCAL, rt: 'adoptive_parent_of' },
    }

    for (const [rel, expected] of Object.entries(cases) as [RelType, typeof cases[RelType]][]) {
      const got = buildPayload(rel, FOCAL, OTHER)
      expect(got, `case ${rel}`).toEqual({
        personAId: expected.aId,
        personBId: expected.bId,
        relationshipType: expected.rt,
      })
    }
  })
})
