import { describe, it, expect } from 'vitest'
import type { Person } from '../../types/person'
import { filterMembersForTree } from './MembersListDrawer'

const SATHE = '10000000-0000-0000-0000-000000000001'
const PANSE = '10000000-0000-0000-0000-000000000002'

function person(id: string, fullName: string, primaryTreeId: string | null): Person {
  return {
    id, fullName, nameBefore: null, phone: null, location: null,
    birthMonthYear: null, deathMonthYear: null, photoBlobUrl: null,
    primaryTreeId,
  }
}

describe('filterMembersForTree', () => {
  const suresh = person('s', 'Suresh Sathe', SATHE)
  const meena  = person('m', 'Meena Sathe',  SATHE) // primary Sathe, cross-links Panse via bridge map
  const arun   = person('a', 'Arun Panse',   PANSE)
  const orphan = person('o', 'Orphan',       null)
  const all = [suresh, meena, arun, orphan]
  const crossTreeMap = new Map<string, string[]>([['m', ['Panse', 'Sathe']]])

  it('returns everyone when no tree is active', () => {
    expect(filterMembersForTree(all, null, undefined, crossTreeMap)).toEqual(all)
  })

  it('keeps primary members of the active tree', () => {
    const result = filterMembersForTree(all, SATHE, 'Sathe', crossTreeMap)
    expect(result.map(p => p.id).sort()).toEqual(['m', 's'])
  })

  it('includes cross-tree bridge persons whose surname list covers the active surname', () => {
    const result = filterMembersForTree(all, PANSE, 'Panse', crossTreeMap)
    // Meena is primary Sathe but bridges into Panse via the cross-tree map; Arun is primary Panse.
    expect(result.map(p => p.id).sort()).toEqual(['a', 'm'])
  })

  it('excludes persons with no primary tree and no bridge entry', () => {
    const result = filterMembersForTree(all, SATHE, 'Sathe', crossTreeMap)
    expect(result.some(p => p.id === 'o')).toBe(false)
  })

  it('returns an empty list when the active tree has no members', () => {
    const empty = filterMembersForTree(all, '99999999-0000-0000-0000-000000000000', 'Other', crossTreeMap)
    expect(empty).toEqual([])
  })
})
