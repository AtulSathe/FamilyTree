export interface Person {
  id: string
  fullName: string
  nameBefore: string | null
  phone: string | null
  location: string | null
  birthMonthYear: string | null
  deathMonthYear: string | null
  photoBlobUrl: string | null
  primaryTreeId: string | null
}

export interface Job {
  title: string | null
  company: string | null
  startMMYYYY: string | null
  endMMYYYY: string | null
}

export interface PersonDetail extends Person {
  hobbies: string | null
  education: string | null
  skills: string | null
  jobs: Job[]
  customFields: Record<string, unknown> | null
}

export interface CreatePersonPayload {
  fullName: string
  nameBefore?: string | null
  phone?: string | null
  location?: string | null
  birthMonthYear?: string | null
  deathMonthYear?: string | null
  treeId: string
  role?: string
}

export interface UpdatePersonPayload {
  fullName?: string
  nameBefore?: string | null
  phone?: string | null
  location?: string | null
  birthMonthYear?: string | null
  deathMonthYear?: string | null
  photoBlobUrl?: string | null
}
