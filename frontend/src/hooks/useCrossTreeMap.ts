import { useMemo } from 'react'
import { useSurnameLinks } from '../api/surnames'
import type { SurnameLink } from '../types/surname'

/**
 * Build the bridge-person → surnames map from SurnameLink rows.
 * Exported so it can be unit-tested without a DOM.
 */
export function buildCrossTreeMap(links: SurnameLink[]): Map<string, string[]> {
  const map = new Map<string, Set<string>>()
  for (const link of links) {
    const set = map.get(link.linkPerson.id) ?? new Set<string>()
    set.add(link.surnameA)
    set.add(link.surnameB)
    map.set(link.linkPerson.id, set)
  }
  const result = new Map<string, string[]>()
  for (const [id, set] of map) {
    result.set(id, Array.from(set).sort())
  }
  return result
}

/**
 * Returns a map from personId → list of surnames that this person bridges.
 *
 * Derived from `/surnames/relationships` (`SurnameLinks` rows). A person who is
 * the `linkPerson` for a cross-tree link is, by definition, a member of both
 * surnames involved — that's what makes them the bridge.
 *
 * The list will contain ≥2 surnames per bridge person.
 */
export function useCrossTreeMap(): Map<string, string[]> {
  const { data: links = [] } = useSurnameLinks()
  return useMemo(() => buildCrossTreeMap(links), [links])
}
