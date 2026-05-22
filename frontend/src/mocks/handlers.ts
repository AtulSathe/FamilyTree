// MSW handlers — returns data in the same shape as the real API.
import { http, HttpResponse } from 'msw'

const BASE = '/api/v1'

// ── Types ──────────────────────────────────────────────────────────────────

interface Person {
  id: string; fullName: string; nameBefore: string | null
  phone: string | null; location: string | null
  birthMonthYear: string | null; deathMonthYear: string | null
  photoBlobUrl: string | null; primaryTreeId: string | null
}

interface RelationDto {
  personId: string; fullName: string; photoBlobUrl: string | null
  location: string | null; birthMonthYear: string | null; deathMonthYear: string | null
  relationshipType: string; direction: 'in' | 'out' | 'both'
}

// ── Seed data (mirrors DataSeeder.cs) ─────────────────────────────────────

const SATHE = '10000000-0000-0000-0000-000000000001'
const PANSE = '10000000-0000-0000-0000-000000000002'

const persons: Record<string, Person> = {
  '20000000-0000-0000-0000-000000000001': { id: '20000000-0000-0000-0000-000000000001', fullName: 'Vishnupant Sathe',  nameBefore: null,       phone: null,             location: 'Pune, Maharashtra',    birthMonthYear: 'Jan 1890', deathMonthYear: 'Mar 1965', photoBlobUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vishnupant',  primaryTreeId: SATHE },
  '20000000-0000-0000-0000-000000000002': { id: '20000000-0000-0000-0000-000000000002', fullName: 'Lakshmibai Sathe', nameBefore: 'Joshi',    phone: null,             location: 'Pune, Maharashtra',    birthMonthYear: 'Jun 1895', deathMonthYear: 'Sep 1970', photoBlobUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lakshmibai', primaryTreeId: SATHE },
  '20000000-0000-0000-0000-000000000003': { id: '20000000-0000-0000-0000-000000000003', fullName: 'Ramchandra Sathe', nameBefore: null,       phone: null,             location: 'Pune, Maharashtra',    birthMonthYear: 'Apr 1920', deathMonthYear: 'Nov 1998', photoBlobUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ramchandra', primaryTreeId: SATHE },
  '20000000-0000-0000-0000-000000000004': { id: '20000000-0000-0000-0000-000000000004', fullName: 'Sumitra Sathe',   nameBefore: 'Kulkarni', phone: null,             location: 'Pune, Maharashtra',    birthMonthYear: 'Feb 1925', deathMonthYear: 'Jan 2005', photoBlobUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sumitra',   primaryTreeId: SATHE },
  '20000000-0000-0000-0000-000000000005': { id: '20000000-0000-0000-0000-000000000005', fullName: 'Suresh Sathe',    nameBefore: null,       phone: '+91-9876543210', location: 'Mumbai, Maharashtra',  birthMonthYear: 'Aug 1950', deathMonthYear: null,       photoBlobUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SureshSathe',primaryTreeId: SATHE },
  '20000000-0000-0000-0000-000000000006': { id: '20000000-0000-0000-0000-000000000006', fullName: 'Meena Sathe',     nameBefore: 'Panse',    phone: '+91-9876543211', location: 'Mumbai, Maharashtra',  birthMonthYear: 'Mar 1955', deathMonthYear: null,       photoBlobUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MeenaSathe', primaryTreeId: SATHE },
  '20000000-0000-0000-0000-000000000007': { id: '20000000-0000-0000-0000-000000000007', fullName: 'Anand Sathe',     nameBefore: null,       phone: '+91-9000000001', location: 'Pune, Maharashtra',    birthMonthYear: 'Dec 1952', deathMonthYear: null,       photoBlobUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AnandSathe',  primaryTreeId: SATHE },
  '20000000-0000-0000-0000-000000000008': { id: '20000000-0000-0000-0000-000000000008', fullName: 'Rahul Sathe',     nameBefore: null,       phone: '+91-9123456789', location: 'Bengaluru, Karnataka', birthMonthYear: 'May 1980', deathMonthYear: null,       photoBlobUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RahulSathe',  primaryTreeId: SATHE },
  '20000000-0000-0000-0000-000000000009': { id: '20000000-0000-0000-0000-000000000009', fullName: 'Priya Sathe',     nameBefore: null,       phone: '+91-9234567890', location: 'Mumbai, Maharashtra',  birthMonthYear: 'Sep 1983', deathMonthYear: null,       photoBlobUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PriyaSathe',  primaryTreeId: SATHE },
  '20000000-0000-0000-0000-000000000010': { id: '20000000-0000-0000-0000-000000000010', fullName: 'Dattatraya Panse',nameBefore: null,       phone: null,             location: 'Nashik, Maharashtra',  birthMonthYear: 'Mar 1882', deathMonthYear: 'Jun 1958', photoBlobUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dattatraya', primaryTreeId: PANSE },
  '20000000-0000-0000-0000-000000000011': { id: '20000000-0000-0000-0000-000000000011', fullName: 'Saraswati Panse', nameBefore: 'Deshpande',phone: null,             location: 'Nashik, Maharashtra',  birthMonthYear: 'Jul 1888', deathMonthYear: 'Oct 1962', photoBlobUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Saraswati', primaryTreeId: PANSE },
  '20000000-0000-0000-0000-000000000012': { id: '20000000-0000-0000-0000-000000000012', fullName: 'Govind Panse',    nameBefore: null,       phone: null,             location: 'Nashik, Maharashtra',  birthMonthYear: 'Jan 1910', deathMonthYear: 'Apr 1985', photoBlobUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GovindPanse', primaryTreeId: PANSE },
  '20000000-0000-0000-0000-000000000013': { id: '20000000-0000-0000-0000-000000000013', fullName: 'Shanta Panse',    nameBefore: 'Gokhale',  phone: null,             location: 'Nashik, Maharashtra',  birthMonthYear: 'May 1915', deathMonthYear: 'Jan 1990', photoBlobUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShantaPanse', primaryTreeId: PANSE },
  '20000000-0000-0000-0000-000000000014': { id: '20000000-0000-0000-0000-000000000014', fullName: 'Madhav Panse',    nameBefore: null,       phone: null,             location: 'Pune, Maharashtra',    birthMonthYear: 'Sep 1912', deathMonthYear: 'Dec 1988', photoBlobUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MadhavPanse', primaryTreeId: PANSE },
  '20000000-0000-0000-0000-000000000015': { id: '20000000-0000-0000-0000-000000000015', fullName: 'Vijaya Panse',    nameBefore: 'Apte',     phone: null,             location: 'Pune, Maharashtra',    birthMonthYear: 'Feb 1918', deathMonthYear: 'Aug 1995', photoBlobUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=VijayaPanse', primaryTreeId: PANSE },
  '20000000-0000-0000-0000-000000000016': { id: '20000000-0000-0000-0000-000000000016', fullName: 'Arun Panse',      nameBefore: null,       phone: '+91-9876500001', location: 'Pune, Maharashtra',    birthMonthYear: 'Jun 1960', deathMonthYear: null,       photoBlobUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ArunPanse',   primaryTreeId: PANSE },
  '20000000-0000-0000-0000-000000000017': { id: '20000000-0000-0000-0000-000000000017', fullName: 'Snehal Panse',    nameBefore: null,       phone: '+91-9876500002', location: 'Hyderabad, Telangana', birthMonthYear: 'Feb 1988', deathMonthYear: null,       photoBlobUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SnehalPanse', primaryTreeId: PANSE },
  // Ramesh Sathe — the Sathe Family Admin (auth user 00000000-...0002 links here via personId).
  // Modeled as a third child of Ramchandra & Sumitra (sibling of Suresh and Anand).
  '20000000-0000-0000-0000-000000000018': { id: '20000000-0000-0000-0000-000000000018', fullName: 'Ramesh Sathe',    nameBefore: null,       phone: '+91-9876543299', location: 'Pune, Maharashtra',    birthMonthYear: 'Oct 1958', deathMonthYear: null,       photoBlobUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RameshSathe', primaryTreeId: SATHE },
}

// ── Helper — build a RelationDto from the persons map ──────────────────────
function rel(id: string, rt: string, dir: 'in' | 'out' | 'both'): RelationDto {
  const p = persons[id]
  return {
    personId: id, fullName: p.fullName, photoBlobUrl: p.photoBlobUrl,
    location: p.location, birthMonthYear: p.birthMonthYear, deathMonthYear: p.deathMonthYear,
    relationshipType: rt, direction: dir,
  }
}

// ── Graph adjacency (mutable so POST /relationships can update it) ──────────
type GraphEntry = { relations: RelationDto[] }
const graph: Record<string, GraphEntry> = {
  // Sathe tree
  '20000000-0000-0000-0000-000000000001': { relations: [ // Vishnupant
    rel('20000000-0000-0000-0000-000000000002', 'spouse',    'both'),
    rel('20000000-0000-0000-0000-000000000003', 'parent_of', 'out'),
  ]},
  '20000000-0000-0000-0000-000000000002': { relations: [ // Lakshmibai
    rel('20000000-0000-0000-0000-000000000001', 'spouse',    'both'),
    rel('20000000-0000-0000-0000-000000000003', 'parent_of', 'out'),
  ]},
  '20000000-0000-0000-0000-000000000003': { relations: [ // Ramchandra
    rel('20000000-0000-0000-0000-000000000001', 'parent_of', 'in'),
    rel('20000000-0000-0000-0000-000000000002', 'parent_of', 'in'),
    rel('20000000-0000-0000-0000-000000000004', 'spouse',    'both'),
    rel('20000000-0000-0000-0000-000000000005', 'parent_of', 'out'),
    rel('20000000-0000-0000-0000-000000000007', 'parent_of', 'out'),
    rel('20000000-0000-0000-0000-000000000018', 'parent_of', 'out'),
  ]},
  '20000000-0000-0000-0000-000000000004': { relations: [ // Sumitra
    rel('20000000-0000-0000-0000-000000000003', 'spouse',    'both'),
    rel('20000000-0000-0000-0000-000000000005', 'parent_of', 'out'),
    rel('20000000-0000-0000-0000-000000000007', 'parent_of', 'out'),
    rel('20000000-0000-0000-0000-000000000018', 'parent_of', 'out'),
  ]},
  '20000000-0000-0000-0000-000000000005': { relations: [ // Suresh
    rel('20000000-0000-0000-0000-000000000003', 'parent_of', 'in'),
    rel('20000000-0000-0000-0000-000000000004', 'parent_of', 'in'),
    rel('20000000-0000-0000-0000-000000000006', 'spouse',    'both'),
    rel('20000000-0000-0000-0000-000000000007', 'sibling_of','both'),
    rel('20000000-0000-0000-0000-000000000018', 'sibling_of','both'),
    rel('20000000-0000-0000-0000-000000000008', 'parent_of', 'out'),
    rel('20000000-0000-0000-0000-000000000009', 'parent_of', 'out'),
  ]},
  '20000000-0000-0000-0000-000000000006': { relations: [ // Meena
    rel('20000000-0000-0000-0000-000000000005', 'spouse',    'both'),
    rel('20000000-0000-0000-0000-000000000008', 'parent_of', 'out'),
    rel('20000000-0000-0000-0000-000000000009', 'parent_of', 'out'),
  ]},
  '20000000-0000-0000-0000-000000000007': { relations: [ // Anand
    rel('20000000-0000-0000-0000-000000000003', 'parent_of', 'in'),
    rel('20000000-0000-0000-0000-000000000004', 'parent_of', 'in'),
    rel('20000000-0000-0000-0000-000000000005', 'sibling_of','both'),
    rel('20000000-0000-0000-0000-000000000018', 'sibling_of','both'),
  ]},
  '20000000-0000-0000-0000-000000000018': { relations: [ // Ramesh (Sathe Family Admin)
    rel('20000000-0000-0000-0000-000000000003', 'parent_of', 'in'),
    rel('20000000-0000-0000-0000-000000000004', 'parent_of', 'in'),
    rel('20000000-0000-0000-0000-000000000005', 'sibling_of','both'),
    rel('20000000-0000-0000-0000-000000000007', 'sibling_of','both'),
  ]},
  '20000000-0000-0000-0000-000000000008': { relations: [ // Rahul
    rel('20000000-0000-0000-0000-000000000005', 'parent_of', 'in'),
    rel('20000000-0000-0000-0000-000000000006', 'parent_of', 'in'),
    rel('20000000-0000-0000-0000-000000000009', 'sibling_of','both'),
  ]},
  '20000000-0000-0000-0000-000000000009': { relations: [ // Priya
    rel('20000000-0000-0000-0000-000000000005', 'parent_of', 'in'),
    rel('20000000-0000-0000-0000-000000000006', 'parent_of', 'in'),
    rel('20000000-0000-0000-0000-000000000008', 'sibling_of','both'),
  ]},
  // Panse tree
  '20000000-0000-0000-0000-000000000010': { relations: [ // Dattatraya
    rel('20000000-0000-0000-0000-000000000011', 'spouse',    'both'),
    rel('20000000-0000-0000-0000-000000000012', 'parent_of', 'out'),
    rel('20000000-0000-0000-0000-000000000014', 'parent_of', 'out'),
  ]},
  '20000000-0000-0000-0000-000000000011': { relations: [ // Saraswati
    rel('20000000-0000-0000-0000-000000000010', 'spouse',    'both'),
    rel('20000000-0000-0000-0000-000000000012', 'parent_of', 'out'),
    rel('20000000-0000-0000-0000-000000000014', 'parent_of', 'out'),
  ]},
  '20000000-0000-0000-0000-000000000012': { relations: [ // Govind
    rel('20000000-0000-0000-0000-000000000010', 'parent_of', 'in'),
    rel('20000000-0000-0000-0000-000000000011', 'parent_of', 'in'),
    rel('20000000-0000-0000-0000-000000000013', 'spouse',    'both'),
    rel('20000000-0000-0000-0000-000000000014', 'sibling_of','both'),
  ]},
  '20000000-0000-0000-0000-000000000013': { relations: [ // Shanta
    rel('20000000-0000-0000-0000-000000000012', 'spouse',    'both'),
  ]},
  '20000000-0000-0000-0000-000000000014': { relations: [ // Madhav
    rel('20000000-0000-0000-0000-000000000010', 'parent_of', 'in'),
    rel('20000000-0000-0000-0000-000000000011', 'parent_of', 'in'),
    rel('20000000-0000-0000-0000-000000000012', 'sibling_of','both'),
    rel('20000000-0000-0000-0000-000000000015', 'spouse',    'both'),
    rel('20000000-0000-0000-0000-000000000016', 'parent_of', 'out'),
    rel('20000000-0000-0000-0000-000000000006', 'parent_of', 'out'),
  ]},
  '20000000-0000-0000-0000-000000000015': { relations: [ // Vijaya
    rel('20000000-0000-0000-0000-000000000014', 'spouse',    'both'),
    rel('20000000-0000-0000-0000-000000000016', 'parent_of', 'out'),
    rel('20000000-0000-0000-0000-000000000006', 'parent_of', 'out'),
  ]},
  '20000000-0000-0000-0000-000000000016': { relations: [ // Arun — focal for Panse tree
    rel('20000000-0000-0000-0000-000000000014', 'parent_of', 'in'),
    rel('20000000-0000-0000-0000-000000000015', 'parent_of', 'in'),
    rel('20000000-0000-0000-0000-000000000006', 'sibling_of','both'),
    rel('20000000-0000-0000-0000-000000000017', 'parent_of', 'out'),
  ]},
  '20000000-0000-0000-0000-000000000017': { relations: [ // Snehal
    rel('20000000-0000-0000-0000-000000000016', 'parent_of', 'in'),
  ]},
}

// ── Mutable tree registry — extended by POST /trees ───────────────────────
interface TreeRow {
  id: string
  surname: string
  description: string
  memberCount: number
}

const trees: TreeRow[] = [
  { id: SATHE, surname: 'Sathe', description: 'Sathe family from Pune, Maharashtra', memberCount: 10 },
  { id: PANSE, surname: 'Panse', description: 'Panse family from Nashik, Maharashtra', memberCount: 8 },
]

// Family admins per tree (person ids). Mirrors FamilyTreeAdmins joined on Users.PersonId.
// Persisted to localStorage so promotions/demotions survive page reloads in mock mode.
const ADMIN_LS_KEY = 'mock-tree-admins'

function seedAdmins(): Record<string, Set<string>> {
  return {
    [SATHE]: new Set(['20000000-0000-0000-0000-000000000018']), // Ramesh Sathe
    [PANSE]: new Set(['20000000-0000-0000-0000-000000000012']), // Govind Panse
  }
}

function loadAdmins(): Record<string, Set<string>> {
  if (typeof localStorage === 'undefined') return seedAdmins()
  const raw = localStorage.getItem(ADMIN_LS_KEY)
  if (!raw) return seedAdmins()
  try {
    const parsed = JSON.parse(raw) as Record<string, string[]>
    return Object.fromEntries(
      Object.entries(parsed).map(([k, v]) => [k, new Set(v)]),
    )
  } catch {
    return seedAdmins()
  }
}

function saveAdmins() {
  if (typeof localStorage === 'undefined') return
  const dump = Object.fromEntries(
    Object.entries(treeAdmins).map(([k, v]) => [k, Array.from(v)]),
  )
  localStorage.setItem(ADMIN_LS_KEY, JSON.stringify(dump))
}

const treeAdmins: Record<string, Set<string>> = loadAdmins()

// ── Handlers ────────────────────────────────────────────────────────────────

export const handlers = [

  // List trees
  http.get(`${BASE}/trees`, () => HttpResponse.json(trees)),

  // Create tree — appends to in-memory list so subsequent GET /trees and /surnames reflect it
  http.post(`${BASE}/trees`, async ({ request }) => {
    const body = await request.json() as { surname?: string; description?: string }
    if (!body.surname || !body.surname.trim()) {
      return HttpResponse.json({ error: 'Surname is required' }, { status: 400 })
    }
    const trimmed = body.surname.trim()
    if (trees.some(t => t.surname.toLowerCase() === trimmed.toLowerCase())) {
      return HttpResponse.json({ error: 'Surname already exists' }, { status: 409 })
    }
    const newTree: TreeRow = {
      id: crypto.randomUUID(),
      surname: trimmed,
      description: body.description?.trim() ?? '',
      memberCount: 0,
    }
    trees.push(newTree)
    return HttpResponse.json(newTree, { status: 201 })
  }),

  // Tree node — returns person + relations array
  http.get(`${BASE}/trees/:treeId/node/:personId`, ({ params }) => {
    const person = persons[params.personId as string]
    if (!person) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    const entry = graph[params.personId as string]
    return HttpResponse.json({ person, relations: entry?.relations ?? [] })
  }),

  // Add relationship — updates in-memory graph so subsequent node fetches reflect it
  http.post(`${BASE}/trees/:treeId/relationships`, async ({ request }) => {
    const body = await request.json() as { personAId: string; personBId: string; relationshipType: string }
    const { personAId, personBId, relationshipType } = body
    const pA = persons[personAId]
    const pB = persons[personBId]
    if (!pA || !pB) return HttpResponse.json({ error: 'Person not found' }, { status: 404 })

    if (!graph[personAId]) graph[personAId] = { relations: [] }
    if (!graph[personBId]) graph[personBId] = { relations: [] }

    const linkedA = graph[personAId].relations.some(r => r.personId === personBId)
    const linkedB = graph[personBId].relations.some(r => r.personId === personAId)

    const DIRECTIONAL = new Set(['parent_of', 'child_of', 'step_parent_of', 'adoptive_parent_of'])
    if (DIRECTIONAL.has(relationshipType)) {
      if (!linkedA) graph[personAId].relations.push(rel(personBId, relationshipType, 'out'))
      if (!linkedB) graph[personBId].relations.push(rel(personAId, relationshipType, 'in'))
    } else {
      if (!linkedA) graph[personAId].relations.push(rel(personBId, relationshipType, 'both'))
      if (!linkedB) graph[personBId].relations.push(rel(personAId, relationshipType, 'both'))
    }

    return new HttpResponse(null, { status: 201 })
  }),

  // Remove relationship — remove edge from both sides of graph
  http.delete(`${BASE}/trees/:treeId/relationships`, async ({ request }) => {
    const body = await request.json() as { personAId: string; personBId: string }
    const { personAId, personBId } = body
    if (graph[personAId]) graph[personAId].relations = graph[personAId].relations.filter(r => r.personId !== personBId)
    if (graph[personBId]) graph[personBId].relations = graph[personBId].relations.filter(r => r.personId !== personAId)
    return new HttpResponse(null, { status: 204 })
  }),

  // Add member to tree
  http.post(`${BASE}/trees/:treeId/members/:personId`, () =>
    new HttpResponse(null, { status: 201 }),
  ),

  // Remove person from a single tree (membership removal — person row + other trees untouched)
  http.delete(`${BASE}/trees/:treeId/members/:personId`, ({ params }) => {
    const treeId = params.treeId as string
    const personId = params.personId as string
    if (!persons[personId]) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    const tree = trees.find(t => t.id === treeId)
    if (!tree) return HttpResponse.json({ error: 'Tree not found' }, { status: 404 })
    if (tree.memberCount > 0) tree.memberCount -= 1
    return new HttpResponse(null, { status: 204 })
  }),

  // List all persons (used by MembersListDrawer). MUST be before /persons/:id.
  http.get(`${BASE}/persons`, () => {
    const all = Object.values(persons).sort((a, b) => a.fullName.localeCompare(b.fullName))
    return HttpResponse.json(all)
  }),

  // Search existing persons — must be BEFORE /persons/:id to avoid route shadowing
  http.get(`${BASE}/persons/search-existing`, ({ request }) => {
    const url = new URL(request.url)
    const q = (url.searchParams.get('q') ?? '').toLowerCase()
    if (q.length < 2) return HttpResponse.json([])
    return HttpResponse.json(
      Object.values(persons)
        .filter(p => p.fullName.toLowerCase().includes(q))
        .slice(0, 8),
    )
  }),

  // Get person
  http.get(`${BASE}/persons/:id`, ({ params }) => {
    const p = persons[params.id as string]
    return p ? HttpResponse.json(p) : HttpResponse.json({ error: 'Not found' }, { status: 404 })
  }),

  // Person detail
  http.get(`${BASE}/persons/:id/detail`, ({ params }) => {
    const p = persons[params.id as string]
    if (!p) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    const details: Record<string, object> = {
      '20000000-0000-0000-0000-000000000008': {
        hobbies: 'Cricket, Photography, Trekking in Sahyadri',
        education: 'B.E. Computer Engineering, Pune (2002); MBA Finance, IIM-A (2004)',
        skills: 'Software Architecture, Azure Cloud, Project Management',
        jobs: [
          { title: 'Software Engineer', company: 'Infosys',  startMMYYYY: 'Jun 2002', endMMYYYY: 'Dec 2005' },
          { title: 'Senior Engineer',   company: 'TCS',      startMMYYYY: 'Jan 2006', endMMYYYY: 'Mar 2010' },
          { title: 'Tech Lead',         company: 'Wipro',    startMMYYYY: 'Apr 2010', endMMYYYY: null },
        ],
        customFields: { languages: ['Marathi', 'Hindi', 'English'] },
      },
      '20000000-0000-0000-0000-000000000009': {
        hobbies: 'Bharatanatyam, Cooking, Marathi literature',
        education: 'MBBS, BJ Medical Pune (2008); MD Paediatrics (2012)',
        skills: 'Paediatrics, Child nutrition, Medical research',
        jobs: [
          { title: 'Junior Doctor',         company: 'KEM Hospital',     startMMYYYY: 'Aug 2008', endMMYYYY: 'Jul 2012' },
          { title: 'Paediatric Consultant', company: 'Lilavati Hospital', startMMYYYY: 'Aug 2012', endMMYYYY: null },
        ],
        customFields: { awards: ['Best Resident 2011'] },
      },
      '20000000-0000-0000-0000-000000000017': {
        hobbies: 'Chess, Badminton, Startup mentoring',
        education: 'B.Tech Electronics, VJTI Mumbai (2010); MS CS, Georgia Tech (2012)',
        skills: 'Machine Learning, Python, Product Management',
        jobs: [
          { title: 'Data Scientist',         company: 'Amazon', startMMYYYY: 'Jul 2012', endMMYYYY: 'Dec 2016' },
          { title: 'Senior Product Manager', company: 'Google', startMMYYYY: 'Jan 2017', endMMYYYY: null },
        ],
        customFields: { languages: ['Marathi', 'Hindi', 'English', 'Kannada'] },
      },
    }
    return HttpResponse.json({ ...p, jobs: [], customFields: {}, ...details[p.id] })
  }),

  // Create person
  http.post(`${BASE}/persons`, async ({ request }) => {
    const body = await request.json() as Partial<Person> & { treeId?: string }
    const newId = crypto.randomUUID()
    const { treeId, ...rest } = body
    const primaryTreeId = treeId ?? rest.primaryTreeId ?? null
    persons[newId] = {
      id: newId, fullName: rest.fullName ?? '', nameBefore: null, phone: null,
      location: null, birthMonthYear: null, deathMonthYear: null, photoBlobUrl: null,
      primaryTreeId, ...rest,
    }
    graph[newId] = { relations: [] }
    if (primaryTreeId) {
      const tree = trees.find(t => t.id === primaryTreeId)
      if (tree) tree.memberCount += 1
    }
    return HttpResponse.json(persons[newId], { status: 201 })
  }),

  // Update person (also handles photo URL update)
  http.put(`${BASE}/persons/:id`, async ({ params, request }) => {
    const body = await request.json() as Partial<Person>
    const id = params.id as string
    if (!persons[id]) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    persons[id] = { ...persons[id], ...body }
    // Propagate name/photo changes to graph relation entries
    Object.values(graph).forEach(entry => {
      entry.relations.forEach(r => {
        if (r.personId === id) {
          if (body.fullName)     r.fullName     = body.fullName
          if (body.photoBlobUrl) r.photoBlobUrl = body.photoBlobUrl
        }
      })
    })
    return HttpResponse.json(persons[id])
  }),

  // Delete person
  http.delete(`${BASE}/persons/:id`, ({ params }) => {
    const id = params.id as string
    if (!persons[id]) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    delete persons[id]
    delete graph[id]
    Object.values(graph).forEach(entry => {
      entry.relations = entry.relations.filter(r => r.personId !== id)
    })
    return new HttpResponse(null, { status: 204 })
  }),

  // Photo upload — return fake SAS URL
  http.post(`${BASE}/persons/:id/photo-upload-url`, ({ params }) => {
    const blobName = `${params.id as string}-photo.jpg`
    return HttpResponse.json({
      sasUrl:   `http://127.0.0.1:10000/devstoreaccount1/person-photos/${blobName}?sv=2023-fake-sas`,
      blobName,
    })
  }),

  // Intercept the SAS PUT itself so the upload flow completes in mock mode
  http.put('http://127.0.0.1:10000/devstoreaccount1/person-photos/:blobName', () =>
    new HttpResponse(null, { status: 201 }),
  ),

  // Surnames — derived from the mutable `trees` registry so new ones show up
  http.get(`${BASE}/surnames`, () => {
    const recentByTree: Record<string, typeof persons[string] | undefined> = {
      [SATHE]: persons['20000000-0000-0000-0000-000000000005'],
      [PANSE]: persons['20000000-0000-0000-0000-000000000016'],
    }
    // For user-created trees, pick a living primary member (fall back to any
    // primary member). Mirrors the real /surnames/:surname/recent contract.
    function deriveRecent(treeId: string) {
      const members = Object.values(persons).filter(p => p.primaryTreeId === treeId)
      if (members.length === 0) return undefined
      const living = members.filter(p => !p.deathMonthYear)
      return living[living.length - 1] ?? members[members.length - 1]
    }
    return HttpResponse.json(
      trees.map(t => ({
        surname: t.surname,
        treeId: t.id,
        memberCount: t.memberCount,
        recentPerson: recentByTree[t.id] ?? deriveRecent(t.id),
      })),
    )
  }),

  // Surname cross-links
  http.get(`${BASE}/surnames/relationships`, () =>
    HttpResponse.json([
      { surnameA: 'Sathe', surnameB: 'Panse', relationshipLevel: 4, linkPerson: persons['20000000-0000-0000-0000-000000000006'], detectedAt: '2024-01-15T00:00:00Z' },
    ]),
  ),

  // Global search
  http.get(`${BASE}/search`, ({ request }) => {
    const url = new URL(request.url)
    const q = (url.searchParams.get('q') ?? '').toLowerCase()
    const surname = url.searchParams.get('surname')
    if (!q) return HttpResponse.json({ error: 'q is required' }, { status: 400 })
    const treeMap: Record<string, string> = {}
    Object.values(persons).forEach(p => { if (p.primaryTreeId) treeMap[p.id] = p.primaryTreeId === SATHE ? 'Sathe' : 'Panse' })
    const results = Object.values(persons)
      .filter(p =>
        p.fullName.toLowerCase().includes(q) &&
        (!surname || treeMap[p.id]?.toLowerCase() === surname.toLowerCase()),
      )
      .map(p => ({ personId: p.id, fullName: p.fullName, location: p.location, birthMonthYear: p.birthMonthYear, treeId: p.primaryTreeId ?? '', surname: treeMap[p.id] ?? '', photoBlobUrl: p.photoBlobUrl }))
    return HttpResponse.json(results)
  }),

  // Mock current user
  http.get(`${BASE}/auth/me`, () =>
    HttpResponse.json({ id: '00000000-0000-0000-0000-000000000002', email: 'sathe.admin@familytree.dev', fullName: 'Ramesh Sathe', role: 'family_admin', assignedTrees: [SATHE], personId: '20000000-0000-0000-0000-000000000018' }),
  ),

  // List family admins for a tree → person ids (frontend cross-refs with persons map)
  http.get(`${BASE}/admin/trees/:treeId/admins`, ({ params }) => {
    const treeId = params.treeId as string
    const ids = Array.from(treeAdmins[treeId] ?? new Set<string>())
    return HttpResponse.json(ids.map(personId => ({
      personId,
      fullName: persons[personId]?.fullName ?? 'Unknown',
    })))
  }),

  // Assign a person as family admin for a tree
  http.post(`${BASE}/admin/trees/:treeId/admins/:personId`, ({ params }) => {
    const treeId = params.treeId as string
    const personId = params.personId as string
    if (!persons[personId]) return HttpResponse.json({ error: 'Person not found' }, { status: 404 })
    if (!trees.some(t => t.id === treeId)) return HttpResponse.json({ error: 'Tree not found' }, { status: 404 })
    if (!treeAdmins[treeId]) treeAdmins[treeId] = new Set()
    treeAdmins[treeId].add(personId)
    saveAdmins()
    return new HttpResponse(null, { status: 201 })
  }),

  // Remove a person from family admins of a tree
  http.delete(`${BASE}/admin/trees/:treeId/admins/:personId`, ({ params }) => {
    const treeId = params.treeId as string
    const personId = params.personId as string
    treeAdmins[treeId]?.delete(personId)
    saveAdmins()
    return new HttpResponse(null, { status: 204 })
  }),

  // Trees where the given person is a family admin — used by useAuth() to drive canEditTree
  http.get(`${BASE}/admin/trees-by-admin/:personId`, ({ params }) => {
    const personId = params.personId as string
    const treeIds = Object.entries(treeAdmins)
      .filter(([, members]) => members.has(personId))
      .map(([treeId]) => treeId)
    return HttpResponse.json(treeIds)
  }),
]
