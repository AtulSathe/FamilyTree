// src/mocks/handlers.ts
// Mock Service Worker handlers — intercept every API call the React app makes.
// Activated in development via: npm run dev:mock
// All data mirrors DataSeeder.cs and seed.groovy exactly.

import { http, HttpResponse } from 'msw'

const BASE = '/api/v1'

// ── Mock data store (mirrors SQL seed) ────────────────────────────────────

export const mockTrees = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    surname: 'Sathe',
    description: 'Sathe family originating from Pune, Maharashtra',
    memberCount: 9,
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    surname: 'Panse',
    description: 'Panse family originating from Nashik, Maharashtra',
    memberCount: 8,
  },
]

export const mockPersons: Record<string, Person> = {
  '20000000-0000-0000-0000-000000000001': {
    id: '20000000-0000-0000-0000-000000000001',
    familyTreeId: '10000000-0000-0000-0000-000000000001',
    fullName: 'Vishnupant Sathe',
    nameBefore: null,
    phone: null,
    location: 'Pune, Maharashtra',
    birthMonthYear: 'Jan 1890',
    deathMonthYear: 'Mar 1965',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vishnupant',
    surname: 'Sathe',
  },
  '20000000-0000-0000-0000-000000000002': {
    id: '20000000-0000-0000-0000-000000000002',
    familyTreeId: '10000000-0000-0000-0000-000000000001',
    fullName: 'Lakshmibai Sathe',
    nameBefore: 'Joshi',
    phone: null,
    location: 'Pune, Maharashtra',
    birthMonthYear: 'Jun 1895',
    deathMonthYear: 'Sep 1970',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lakshmibai',
    surname: 'Sathe',
  },
  '20000000-0000-0000-0000-000000000003': {
    id: '20000000-0000-0000-0000-000000000003',
    familyTreeId: '10000000-0000-0000-0000-000000000001',
    fullName: 'Ramchandra Sathe',
    nameBefore: null,
    phone: null,
    location: 'Pune, Maharashtra',
    birthMonthYear: 'Apr 1920',
    deathMonthYear: 'Nov 1998',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ramchandra',
    surname: 'Sathe',
  },
  '20000000-0000-0000-0000-000000000004': {
    id: '20000000-0000-0000-0000-000000000004',
    familyTreeId: '10000000-0000-0000-0000-000000000001',
    fullName: 'Sumitra Sathe',
    nameBefore: 'Kulkarni',
    phone: null,
    location: 'Pune, Maharashtra',
    birthMonthYear: 'Feb 1925',
    deathMonthYear: 'Jan 2005',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sumitra',
    surname: 'Sathe',
  },
  '20000000-0000-0000-0000-000000000005': {
    id: '20000000-0000-0000-0000-000000000005',
    familyTreeId: '10000000-0000-0000-0000-000000000001',
    fullName: 'Suresh Sathe',
    nameBefore: null,
    phone: '+91-9876543210',
    location: 'Mumbai, Maharashtra',
    birthMonthYear: 'Aug 1950',
    deathMonthYear: null,
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SureshSathe',
    surname: 'Sathe',
  },
  '20000000-0000-0000-0000-000000000006': {
    id: '20000000-0000-0000-0000-000000000006',
    familyTreeId: '10000000-0000-0000-0000-000000000001',
    fullName: 'Meena Sathe',
    nameBefore: 'Panse',
    phone: '+91-9876543211',
    location: 'Mumbai, Maharashtra',
    birthMonthYear: 'Mar 1955',
    deathMonthYear: null,
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MeenaSathe',
    surname: 'Sathe',
  },
  '20000000-0000-0000-0000-000000000007': {
    id: '20000000-0000-0000-0000-000000000007',
    familyTreeId: '10000000-0000-0000-0000-000000000001',
    fullName: 'Anand Sathe',
    nameBefore: null,
    phone: '+91-9000000001',
    location: 'Pune, Maharashtra',
    birthMonthYear: 'Dec 1952',
    deathMonthYear: null,
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AnandSathe',
    surname: 'Sathe',
  },
  '20000000-0000-0000-0000-000000000008': {
    id: '20000000-0000-0000-0000-000000000008',
    familyTreeId: '10000000-0000-0000-0000-000000000001',
    fullName: 'Rahul Sathe',
    nameBefore: null,
    phone: '+91-9123456789',
    location: 'Bengaluru, Karnataka',
    birthMonthYear: 'May 1980',
    deathMonthYear: null,
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RahulSathe',
    surname: 'Sathe',
  },
  '20000000-0000-0000-0000-000000000009': {
    id: '20000000-0000-0000-0000-000000000009',
    familyTreeId: '10000000-0000-0000-0000-000000000001',
    fullName: 'Priya Sathe',
    nameBefore: null,
    phone: '+91-9234567890',
    location: 'Mumbai, Maharashtra',
    birthMonthYear: 'Sep 1983',
    deathMonthYear: null,
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PriyaSathe',
    surname: 'Sathe',
  },
  '20000000-0000-0000-0000-000000000016': {
    id: '20000000-0000-0000-0000-000000000016',
    familyTreeId: '10000000-0000-0000-0000-000000000002',
    fullName: 'Arun Panse',
    nameBefore: null,
    phone: '+91-9876500001',
    location: 'Pune, Maharashtra',
    birthMonthYear: 'Jun 1960',
    deathMonthYear: null,
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ArunPanse',
    surname: 'Panse',
  },
  '20000000-0000-0000-0000-000000000017': {
    id: '20000000-0000-0000-0000-000000000017',
    familyTreeId: '10000000-0000-0000-0000-000000000002',
    fullName: 'Snehal Panse',
    nameBefore: null,
    phone: '+91-9876500002',
    location: 'Hyderabad, Telangana',
    birthMonthYear: 'Feb 1988',
    deathMonthYear: null,
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SnehalPanse',
    surname: 'Panse',
  },
}

const mockPersonDetails: Record<string, PersonDetail> = {
  '20000000-0000-0000-0000-000000000008': {
    personId: '20000000-0000-0000-0000-000000000008',
    hobbies: 'Cricket, Photography, Trekking in Sahyadri ranges',
    education: 'B.E. Computer Engineering, University of Pune (2002); MBA Finance, IIM Ahmedabad (2004)',
    skills: 'Software Architecture, Project Management, Azure Cloud',
    jobs: [
      { title: 'Software Engineer', company: 'Infosys', start: 'Jun 2002', end: 'Dec 2005' },
      { title: 'Senior Engineer', company: 'TCS', start: 'Jan 2006', end: 'Mar 2010' },
      { title: 'Tech Lead', company: 'Wipro', start: 'Apr 2010', end: 'present' },
    ],
    customFields: { languages: ['Marathi', 'Hindi', 'English'] },
  },
  '20000000-0000-0000-0000-000000000009': {
    personId: '20000000-0000-0000-0000-000000000009',
    hobbies: 'Classical dance (Bharatanatyam), Cooking, Reading Marathi literature',
    education: 'MBBS, B.J. Medical College Pune (2008); MD Paediatrics (2012)',
    skills: 'Paediatrics, Child nutrition, Medical research',
    jobs: [
      { title: 'Junior Doctor', company: 'KEM Hospital Mumbai', start: 'Aug 2008', end: 'Jul 2012' },
      { title: 'Paediatric Consultant', company: 'Lilavati Hospital', start: 'Aug 2012', end: 'present' },
    ],
    customFields: { awards: ['Best Resident 2011'], languages: ['Marathi', 'Hindi', 'English'] },
  },
  '20000000-0000-0000-0000-000000000017': {
    personId: '20000000-0000-0000-0000-000000000017',
    hobbies: 'Chess, Badminton, Startup mentoring',
    education: 'B.Tech Electronics, VJTI Mumbai (2010); MS Computer Science, Georgia Tech (2012)',
    skills: 'Machine Learning, Python, Product Management',
    jobs: [
      { title: 'Data Scientist', company: 'Amazon', start: 'Jul 2012', end: 'Dec 2016' },
      { title: 'Senior Product Manager', company: 'Google', start: 'Jan 2017', end: 'present' },
    ],
    customFields: { languages: ['Marathi', 'Hindi', 'English', 'Kannada'] },
  },
}

// Adjacency map — mirrors Gremlin graph edges
const mockGraph: Record<string, GraphNode> = {
  '20000000-0000-0000-0000-000000000005': { // Suresh
    parents:  ['20000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004'],
    spouses:  ['20000000-0000-0000-0000-000000000006'],
    children: ['20000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000009'],
    siblings: ['20000000-0000-0000-0000-000000000007'],
  },
  '20000000-0000-0000-0000-000000000008': { // Rahul
    parents:  ['20000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000006'],
    spouses:  [],
    children: [],
    siblings: ['20000000-0000-0000-0000-000000000009'],
  },
  '20000000-0000-0000-0000-000000000009': { // Priya
    parents:  ['20000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000006'],
    spouses:  [],
    children: [],
    siblings: ['20000000-0000-0000-0000-000000000008'],
  },
}

// ── Types ──────────────────────────────────────────────────────────────────
interface Person {
  id: string; familyTreeId: string; fullName: string; nameBefore: string | null
  phone: string | null; location: string; birthMonthYear: string
  deathMonthYear: string | null; photoUrl: string; surname: string
}
interface PersonDetail {
  personId: string; hobbies: string; education: string; skills: string
  jobs: { title: string; company: string; start: string; end: string }[]
  customFields: Record<string, unknown>
}
interface GraphNode {
  parents: string[]; spouses: string[]; children: string[]; siblings: string[]
}

// ── Handlers ───────────────────────────────────────────────────────────────
export const handlers = [

  // List all family trees
  http.get(`${BASE}/trees`, () => HttpResponse.json(mockTrees)),

  // Get tree node + 1 level up/down
  http.get(`${BASE}/trees/:treeId/node/:personId`, ({ params }) => {
    const person = mockPersons[params.personId as string]
    if (!person) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    const graph = mockGraph[params.personId as string] ?? { parents: [], spouses: [], children: [], siblings: [] }
    const expand = (ids: string[]) => ids.map(id => mockPersons[id]).filter(Boolean)
    return HttpResponse.json({
      person,
      parents:  expand(graph.parents),
      spouses:  expand(graph.spouses),
      children: expand(graph.children),
      siblings: expand(graph.siblings),
    })
  }),

  // Get person by ID
  http.get(`${BASE}/persons/:id`, ({ params }) => {
    const person = mockPersons[params.id as string]
    return person
      ? HttpResponse.json(person)
      : HttpResponse.json({ error: 'Not found' }, { status: 404 })
  }),

  // Get person detail
  http.get(`${BASE}/persons/:id/detail`, ({ params }) => {
    const detail = mockPersonDetails[params.id as string]
    return detail
      ? HttpResponse.json(detail)
      : HttpResponse.json({ hobbies: '', education: '', skills: '', jobs: [], customFields: {} })
  }),

  // Create person (Power/Family Admin)
  http.post(`${BASE}/persons`, async ({ request }) => {
    const body = await request.json() as Partial<Person>
    const newId = crypto.randomUUID()
    mockPersons[newId] = { ...body, id: newId } as Person
    return HttpResponse.json(mockPersons[newId], { status: 201 })
  }),

  // Update person
  http.put(`${BASE}/persons/:id`, async ({ params, request }) => {
    const body = await request.json() as Partial<Person>
    if (!mockPersons[params.id as string]) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    mockPersons[params.id as string] = { ...mockPersons[params.id as string], ...body }
    return HttpResponse.json(mockPersons[params.id as string])
  }),

  // Surnames list
  http.get(`${BASE}/surnames`, () =>
    HttpResponse.json([
      { surname: 'Sathe', treeId: '10000000-0000-0000-0000-000000000001', memberCount: 9,
        recentPerson: mockPersons['20000000-0000-0000-0000-000000000008'] },
      { surname: 'Panse', treeId: '10000000-0000-0000-0000-000000000002', memberCount: 8,
        recentPerson: mockPersons['20000000-0000-0000-0000-000000000017'] },
    ])
  ),

  // Surname cross-tree relationships
  http.get(`${BASE}/surnames/relationships`, () =>
    HttpResponse.json([
      {
        surnameA: 'Sathe',
        surnameB: 'Panse',
        relationshipLevel: 4,
        linkPerson: mockPersons['20000000-0000-0000-0000-000000000006'], // Meena
        detectedAt: '2024-01-15T00:00:00Z',
      },
    ])
  ),

  // Search
  http.get(`${BASE}/search`, ({ request }) => {
    const url = new URL(request.url)
    const q = (url.searchParams.get('q') ?? '').toLowerCase()
    const surname = url.searchParams.get('surname')
    const results = Object.values(mockPersons).filter(p => {
      const nameMatch = p.fullName.toLowerCase().includes(q)
      const surnameMatch = !surname || p.surname.toLowerCase() === surname.toLowerCase()
      return nameMatch && surnameMatch
    })
    return HttpResponse.json({ results, total: results.length })
  }),

  // Photo upload SAS URL (returns a fake Azurite URL in dev)
  http.post(`${BASE}/persons/:id/photo-upload-url`, ({ params }) => {
    const blobName = `${params.id}-photo.jpg`
    return HttpResponse.json({
      sasUrl: `http://127.0.0.1:10000/devstoreaccount1/person-photos/${blobName}?sv=2023-fake-sas`,
      blobName,
    })
  }),

  // Mock JWT — current user (dev only, bypasses B2C)
  http.get(`${BASE}/auth/me`, () =>
    HttpResponse.json({
      id: '00000000-0000-0000-0000-000000000002',
      email: 'sathe.admin@familytree.dev',
      fullName: 'Ramesh Sathe',
      role: 'family_admin',
      assignedTrees: ['10000000-0000-0000-0000-000000000001'],
    })
  ),
]
