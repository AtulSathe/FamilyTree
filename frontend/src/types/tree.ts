import type { Person } from './person'

export interface FamilyTree {
  id: string
  surname: string
  description: string | null
  memberCount: number
}

export interface RelationDto {
  personId: string
  fullName: string
  photoBlobUrl: string | null
  location: string | null
  birthMonthYear: string | null
  deathMonthYear: string | null
  relationshipType: string
  direction: 'in' | 'out' | 'both'
}

export interface TreeNode {
  person: Person
  relations: RelationDto[]
}

export interface CreateRelationshipPayload {
  personAId: string
  personBId: string
  relationshipType: string
}
