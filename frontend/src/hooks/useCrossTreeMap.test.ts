import { describe, it, expect } from 'vitest'
import type { SurnameLink } from '../types/surname'
import type { Person } from '../types/person'
import { buildCrossTreeMap } from './useCrossTreeMap'

function personFixture(id: string, fullName: string): Person {
  return {
    id, fullName, nameBefore: null, phone: null, location: null,
    birthMonthYear: null, deathMonthYear: null, photoBlobUrl: null,
    primaryTreeId: null,
  }
}

function link(surnameA: string, surnameB: string, p: Person): SurnameLink {
  return { surnameA, surnameB, relationshipLevel: 1, linkPerson: p, detectedAt: '' }
}

describe('buildCrossTreeMap', () => {
  it('returns an empty map when there are no links', () => {
    expect(buildCrossTreeMap([]).size).toBe(0)
  })

  it('maps a bridge person to both surnames (sorted)', () => {
    const meena = personFixture('meena', 'Meena')
    const map = buildCrossTreeMap([link('Sathe', 'Panse', meena)])
    expect(map.get('meena')).toEqual(['Panse', 'Sathe'])
  })

  it('unions surnames when the same person appears in multiple links', () => {
    const bridge = personFixture('b', 'Bridge')
    const map = buildCrossTreeMap([
      link('A', 'B', bridge),
      link('B', 'C', bridge),
    ])
    expect(map.get('b')).toEqual(['A', 'B', 'C'])
  })

  it('keeps separate entries per bridge person', () => {
    const meena = personFixture('m', 'Meena')
    const arun  = personFixture('a', 'Arun')
    const map = buildCrossTreeMap([
      link('Sathe', 'Panse', meena),
      link('Panse', 'Joshi', arun),
    ])
    expect(map.size).toBe(2)
    expect(map.get('m')).toEqual(['Panse', 'Sathe'])
    expect(map.get('a')).toEqual(['Joshi', 'Panse'])
  })
})
