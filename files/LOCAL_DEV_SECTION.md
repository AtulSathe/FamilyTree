---

## Local development & mock data

> This section is **mandatory reading** before running any code locally.
> Never call real Azure services during development — all Azure dependencies have local substitutes.

### The two local dev modes

| Mode | When to use | What runs |
|---|---|---|
| **Full local stack** | Backend + frontend together, integration testing | Docker + .NET API + Vite |
| **Frontend-only (MSW)** | UI development without any backend | Vite only, MSW intercepts all API calls |

---

### Step 1 — Start local services (Docker)

```bash
cd mock-data
docker compose up -d
```

This starts:
- SQL Server 2022 on `localhost:1433` (password: `FamilyTree_Dev#2024`)
- Gremlin Server (TinkerPop 3.7.1) on `localhost:8182`
- Azurite (Azure Blob emulator) on `localhost:10000`

Wait for healthy status: `docker compose ps`

---

### Step 2 — Run the backend

```bash
cd backend/FamilyTree.Api
```

Create `appsettings.Development.json` (not committed to git):

```json
{
  "USE_MOCK_AUTH": true,
  "AzureSQL": {
    "ConnectionString": "Server=localhost,1433;Database=FamilyTreeDev;User Id=sa;Password=FamilyTree_Dev#2024;TrustServerCertificate=true"
  },
  "CosmosDb": {
    "GremlinEndpoint": "localhost",
    "GremlinPort": 8182,
    "GremlinUsername": "/dbs/familytree/colls/relationships",
    "GremlinPassword": "",
    "Database": "familytree",
    "Container": "relationships",
    "EnableSsl": false
  },
  "AzureBlob": {
    "ConnectionString": "UseDevelopmentStorage=true",
    "ContainerName": "person-photos",
    "CdnBaseUrl": "http://127.0.0.1:10000/devstoreaccount1"
  }
}
```

Then run:

```bash
dotnet ef database update    # applies EF migrations to local SQL Server
dotnet run                   # API starts on https://localhost:7001
                             # DataSeeder runs automatically on startup
```

The `DataSeeder.cs` seeds:
- 2 family trees: Sathe, Panse
- 17 persons across 4 generations
- Person details for Rahul Sathe, Priya Sathe, Snehal Panse
- 1 pre-computed surname link: Sathe ↔ Panse (level 4, via Meena)

---

### Step 3a — Run the frontend (full stack mode)

```bash
cd frontend
cp .env.example .env.local
# .env.local contents:
# VITE_API_BASE_URL=https://localhost:7001/api/v1
# VITE_USE_MOCK=false

npm install
npm run dev     # http://localhost:5173
```

---

### Step 3b — Run the frontend (MSW mode — no backend needed)

```bash
cd frontend
npx msw init public/ --save    # first time only — generates public/mockServiceWorker.js
cp .env.example .env.local
# .env.local contents:
# VITE_USE_MOCK=true

npm run dev
```

Add this to `src/main.tsx`:

```tsx
async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCK !== 'true') return
  const { worker } = await import('./mocks/browser')
  return worker.start({ onUnhandledRequest: 'bypass' })
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
})
```

MSW intercepts every `GET/POST/PUT` call and returns data from `src/mocks/handlers.ts`.
All 17 seed persons, both trees, surname relationships, and search are mocked.

---

### Mock auth — switching roles

When `USE_MOCK_AUTH=true`, the backend reads HTTP headers instead of validating a JWT.
Use any REST client (Bruno, Postman, Thunder Client) or the browser dev tools:

| Header | Values |
|---|---|
| `X-Mock-User-Role` | `power_admin` \| `family_admin` \| `community_member` |
| `X-Mock-User-Id` | any UUID from DataSeeder.cs (see Users section) |
| `X-Mock-User-Email` | any string |

Default when headers are absent: `family_admin` for the Sathe tree.

**Test all three roles** before any feature is considered done:
1. `community_member` — all write buttons should be hidden/disabled
2. `family_admin` — can edit Sathe tree, cannot edit Panse tree
3. `power_admin` — can do everything

---

### Mock data map

```
Sathe tree (ID: 10000000-...0001)
│
├── Gen 1: Vishnupant + Lakshmibai (née Joshi)
│   └── Gen 2: Ramchandra + Sumitra (née Kulkarni)
│       ├── Gen 3: Suresh + Meena (née PANSE) ◄─── cross-tree link
│       │   ├── Gen 4: Rahul Sathe  [has full PersonDetail]
│       │   └── Gen 4: Priya Sathe  [has full PersonDetail]
│       └── Gen 3: Anand (sibling of Suresh)

Panse tree (ID: 10000000-...0002)
│
└── Gen 1: Dattatraya + Saraswati (née Deshpande)
    ├── Gen 2: Govind + Shanta (née Gokhale)
    └── Gen 2: Madhav + Vijaya (née Apte)
        ├── Meena Panse → married Suresh Sathe (cross-tree)
        ├── Gen 3: Arun Panse
        │   └── Gen 4: Snehal Panse  [has full PersonDetail]
        └── (sibling of Arun: Meena, lives in Sathe tree node)

Surname link: Sathe ↔ Panse, level 4, bridge = Meena (ID: ...0006)
```

---

### What is NOT mocked locally

| Feature | Reason | Workaround |
|---|---|---|
| Real Azure AD B2C token | Requires tenant registration | Use `USE_MOCK_AUTH=true` header approach |
| Azure CDN photo serving | CDN sits in front of Blob | Photos use DiceBear avatar URLs in seed data |
| Email notifications (future) | Not in scope phase 1 | N/A |
| Full BFS surname detection job | Background job skipped | SurnameLink pre-seeded directly in DataSeeder.cs |

---

### Resetting local data

```bash
# Reset SQL + re-seed
docker compose stop sqlserver
docker volume rm mock-data_sqldata
docker compose up -d sqlserver
dotnet ef database update
dotnet run   # DataSeeder runs again

# Reset Gremlin
docker compose restart gremlin

# Reset Azurite blobs
docker compose stop azurite
docker volume rm mock-data_azuritedata
docker compose up -d azurite
```
