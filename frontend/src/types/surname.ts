import type { Person } from './person'

export interface SurnameInfo {
  surname: string
  treeId: string
  memberCount: number
  recentPerson?: Person
}

export interface SurnameLink {
  surnameA: string
  surnameB: string
  relationshipLevel: number
  linkPerson: Person
  detectedAt: string
}
