# FamilyTree App — claude.md

> This file is the single source of truth for Claude Code when building the FamilyTree application.
> Read this entire file before writing any code, creating any file, or running any command.

---

## Project overview

A web application for creating, viewing, and exploring family trees across multiple surnames.
Community members can view all trees. Family Admins can edit their assigned trees. A Power Admin manages everything.

**Stack**

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript, Vite, TailwindCSS, React Flow (canvas), i18next (i18n) |
| Backend | .NET 8 Minimal API, C#, Entity Framework Core 8 |
| Primary DB | Azure SQL (people, users, audit log) |
| Graph DB | Azure Cosmos DB — Gremlin API (person vertices + relationship edges) |
| Auth | Azure AD B2C (email + password, JWT bearer tokens) |
| Storage | Azure Blob Storage + Azure CDN (person photos) |
| Hosting | Azure Static Web Apps (frontend), Azure App Service (backend API) |
| CI/CD | GitHub Actions |

---

## Repository structure

```
/
├── frontend/                   # React + TypeScript SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── tree/           # Canvas, Node, EdgeTypes
│   │   │   ├── person/         # PersonCard, PersonDetail, PersonForm
│   │   │   ├── surname/        # SurnamePanel, SurnameRelationships
│   │   │   ├── search/         # SearchBar, SearchResults
│   │   │   ├── layout/         # AppShell, LeftPane, TopBar
│   │   │   └── common/         # Button, Modal, Avatar, Badge
│   │   ├── pages/
│   │   │   ├── TreePage.tsx
│   │   │   ├── PersonDetailPage.tsx
│   │   │   └── SurnameRelationshipsPage.tsx
│   │   ├── hooks/              # useTreeData, usePersonSearch, useAuth
│   │   ├── store/              # Zustand store slices
│   │   ├── api/                # Typed API client (axios + react-query)
│   │   ├── i18n/               # Translation files (en, hi, mr)
│   │   ├── types/              # Shared TypeScript interfaces
│   │   └── utils/
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   └── tailwind.config.ts
│
├── backend/                    # .NET 8 Minimal API
│   ├── FamilyTree.Api/
│   │   ├── Endpoints/
│   │   │   ├── PersonEndpoints.cs
│   │   │   ├── TreeEndpoints.cs
│   │   │   ├── RelationshipEndpoints.cs
│   │   │   ├── SurnameEndpoints.cs
│   │   │   ├── SearchEndpoints.cs
│   │   │   └── AdminEndpoints.cs
│   │   ├── Models/             # Request/Response DTOs
│   │   ├── Domain/             # Domain entities
│   │   ├── Data/
│   │   │   ├── AppDbContext.cs          # EF Core — Azure SQL
│   │   │   └── GraphDbContext.cs        # Gremlin client — Cosmos DB
│   │   ├── Services/
│   │   │   ├── PersonService.cs
│   │   │   ├── GraphTraversalService.cs
│   │   │   ├── SurnameRelationshipService.cs
│   │   │   ├── PhotoUploadService.cs
│   │   │   └── AuditService.cs
│   │   ├── Middleware/
│   │   │   ├── AuthMiddleware.cs
│   │   │   └── AuditMiddleware.cs
│   │   ├── Program.cs
│   │   └── appsettings.json
│   └── FamilyTree.Tests/
│
├── infra/                      # Bicep / ARM templates (Azure)
│   ├── main.bicep
│   ├── sql.bicep
│   ├── cosmos.bicep
│   ├── storage.bicep
│   └── appservice.bicep
│
├── .github/
│   └── workflows/
│       ├── frontend-deploy.yml
│       └── backend-deploy.yml
│
└── claude.md                   # This file
```

---

## Functional requirements (source of truth)

| ID | Requirement |
|---|---|
| FR-01 | Person node stores: full_name, name_before_marriage, phone, birth_month_year (MMM YYYY), death_month_year, location, photo_blob_url, extended_fields (JSON) |
| FR-02 | Node on canvas: photo + name. Hover tooltip: location, birth, death |
| FR-03 | Double-click opens PersonDetailPage with: hobbies, education, skills, jobs (array of {title, company, mmyyyy_start, mmyyyy_end}), custom_fields (extensible JSON) |
| FR-04 | PersonDetailPage has Add/Edit button (role-gated) and Back to Tree button |
| FR-05 | Default view: selected person + 1 ancestor level + 1 descendant level |
| FR-06 | +/- buttons on node expand/collapse further levels (load on demand) |
| FR-07 | Left pane: list of all surnames. Click → open that tree centred on most recent living member |
| FR-08 | Surname relationships page: auto-detected cross-tree pairs with hop count. Click → jump to linking node |
| FR-09 | Power Admin: add new family tree |
| FR-10 | Family Admin / Power Admin: add node with relationship type (spouse, parent, child, sibling, in-law, step-parent, adoptive) |
| FR-11 | Search: by name across all trees or filtered by surname. Returns person card with tree/surname context |
| FR-12 | Multi-language: English, Hindi, Marathi. Language switcher in top bar |
| FR-13 | Audit log: every create/update/delete records user, timestamp, old value, new value |
| FR-14 | Photo upload: user uploads file → API returns SAS URL → client PUT to Blob directly → save CDN URL to person record |

---

## User roles & permissions

| Role | Value stored in JWT claim `extension_Role` | Permissions |
|---|---|---|
| `PowerAdmin` | `power_admin` | All CRUD on all trees, all persons, all users; manage Family Admins |
| `FamilyAdmin` | `family_admin` | CRUD on persons/trees they are assigned to (checked via FAMILY_TREE_ADMIN table) |
| `CommunityMember` | `community_member` | Read-only on all trees and persons |

**Rule**: Every mutating endpoint checks JWT role claim. FamilyAdmin endpoints additionally verify the user's assigned trees include the target tree_id.

---

## Azure SQL schema

Run migrations with EF Core (`dotnet ef migrations add` / `dotnet ef database update`).

> **Key design decision**: A person can belong to multiple family trees (e.g. a woman born in the Panse
> tree who marries into the Sathe tree). `Persons` therefore has **no** `FamilyTreeId` column.
> Tree membership is recorded in the `PersonTreeMemberships` junction table instead.
> This guarantees one identity row per real person regardless of how many trees they appear in.

```sql
-- family_trees (create before Persons — Persons references it)
CREATE TABLE FamilyTrees (
  Id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
  Surname     NVARCHAR(100) NOT NULL,
  Description NVARCHAR(500),
  CreatedBy   UNIQUEIDENTIFIER REFERENCES Users(Id),
  CreatedAt   DATETIME2 DEFAULT GETUTCDATE()
);

-- persons — NO FamilyTreeId column
-- PrimaryTreeId = the tree the person was first created in (display/admin hint only)
CREATE TABLE Persons (
  Id             UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
  PrimaryTreeId  UNIQUEIDENTIFIER REFERENCES FamilyTrees(Id),  -- first tree added to
  FullName       NVARCHAR(200) NOT NULL,
  NameBefore     NVARCHAR(200),   -- maiden / pre-marriage surname
  Phone          NVARCHAR(50),
  Location       NVARCHAR(300),
  BirthMonthYear NVARCHAR(20),    -- e.g. "Jan 1952"
  DeathMonthYear NVARCHAR(20),
  PhotoBlobUrl   NVARCHAR(500),
  ExtendedFields NVARCHAR(MAX),   -- JSON column for future ad-hoc fields
  CreatedBy      UNIQUEIDENTIFIER REFERENCES Users(Id),
  CreatedAt      DATETIME2 DEFAULT GETUTCDATE(),
  UpdatedAt      DATETIME2
);

-- person_tree_memberships — which trees a person appears in and in what role
-- A person married from Panse into Sathe gets TWO rows here: one per tree.
-- The UI uses this to show the person's node in both trees' canvases.
CREATE TABLE PersonTreeMemberships (
  PersonId     UNIQUEIDENTIFIER NOT NULL REFERENCES Persons(Id),
  FamilyTreeId UNIQUEIDENTIFIER NOT NULL REFERENCES FamilyTrees(Id),
  Role         NVARCHAR(50) NOT NULL DEFAULT 'member',
                -- 'member'        = born/native to this tree
                -- 'married_in'    = joined via spouse edge from another tree
                -- 'admin_linked'  = manually linked by an admin
  AddedAt      DATETIME2 DEFAULT GETUTCDATE(),
  AddedBy      UNIQUEIDENTIFIER REFERENCES Users(Id),
  PRIMARY KEY (PersonId, FamilyTreeId)
);

-- person_details (one-to-one, lazy loaded on double-click)
CREATE TABLE PersonDetails (
  Id           UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
  PersonId     UNIQUEIDENTIFIER NOT NULL UNIQUE REFERENCES Persons(Id),
  Hobbies      NVARCHAR(MAX),
  Education    NVARCHAR(MAX),
  Skills       NVARCHAR(MAX),
  Jobs         NVARCHAR(MAX),     -- JSON array: [{title, company, start, end}]
  CustomFields NVARCHAR(MAX)      -- JSON for future extensibility
);

-- users
CREATE TABLE Users (
  Id        UNIQUEIDENTIFIER PRIMARY KEY,  -- matches Azure AD B2C object ID
  Email     NVARCHAR(200) NOT NULL UNIQUE,
  FullName  NVARCHAR(200),
  Role      NVARCHAR(50) NOT NULL DEFAULT 'community_member',
  CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

-- family_tree_admins (many-to-many: which users admin which trees)
CREATE TABLE FamilyTreeAdmins (
  FamilyTreeId UNIQUEIDENTIFIER REFERENCES FamilyTrees(Id),
  UserId       UNIQUEIDENTIFIER REFERENCES Users(Id),
  PRIMARY KEY (FamilyTreeId, UserId)
);

-- audit_log
CREATE TABLE AuditLog (
  Id         UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
  UserId     UNIQUEIDENTIFIER REFERENCES Users(Id),
  EntityType NVARCHAR(100),   -- 'Person' | 'FamilyTree' | 'Relationship' | 'User'
  EntityId   UNIQUEIDENTIFIER,
  Action     NVARCHAR(20),    -- CREATE | UPDATE | DELETE
  OldValue   NVARCHAR(MAX),   -- JSON snapshot before change
  NewValue   NVARCHAR(MAX),   -- JSON snapshot after change
  ChangedAt  DATETIME2 DEFAULT GETUTCDATE()
);

-- surname_links (pre-computed nightly by background job)
-- Stores detected cross-tree surname connections via marriage edges.
CREATE TABLE SurnameLinks (
  Id                UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
  SurnameA          NVARCHAR(100) NOT NULL,
  SurnameB          NVARCHAR(100) NOT NULL,
  LinkPersonId      UNIQUEIDENTIFIER REFERENCES Persons(Id),  -- the bridge person
  RelationshipLevel INT NOT NULL,   -- graph hop count between the two surname roots
  DetectedAt        DATETIME2 DEFAULT GETUTCDATE(),
  CONSTRAINT UQ_SurnameLink UNIQUE (SurnameA, SurnameB, LinkPersonId)
);
```

**EF Core notes**:
- Use `[Column(TypeName = "nvarchar(max)")]` + `string` (serialized JSON) for `ExtendedFields`, `Jobs`, `CustomFields`.
- `PersonTreeMemberships` is the authoritative source for "which persons are in this tree" — never query `Persons` directly by tree without joining this table.
- Enable `EnableSensitiveDataLogging` only in Development.
- The `Persons` → `FamilyTrees` FK on `PrimaryTreeId` is nullable to allow creating a person before assigning them to a tree.

### How tree membership works in practice

**Scenario**: Tara is born Panse, marries Ravi Sathe. Sathe tree is created first.

| Step | Action | PersonTreeMemberships rows for Tara |
|---|---|---|
| 1 | Sathe Admin adds Tara as Ravi's spouse | `(Tara, SatheTree, 'married_in')` |
| 2 | Panse tree created later | — |
| 3 | Panse Admin searches "Tara Panse", finds existing Person row, links as daughter of Shri & Shruti | `(Tara, SatheTree, 'married_in')` + `(Tara, PanseTree, 'member')` |

Result: one `Persons` row for Tara, appears correctly in both tree canvases. Search returns one result. Edits to her record are reflected everywhere immediately.

---

## Cosmos DB — Gremlin graph schema

**Endpoint**: configured in `appsettings.json` → `CosmosDb:GremlinEndpoint`

### Vertices

```
g.addV('person')
  .property('personId', '<azure-sql-uuid>')   // foreign key to SQL Persons table
  .property('fullName', '...')
  .property('nameBefore', '...')              // maiden surname — used for cross-tree detection
  .property('primaryTreeId', '...')           // matches Persons.PrimaryTreeId
  // NOTE: no familyTreeId — a person can belong to multiple trees.
  // Tree membership is in SQL PersonTreeMemberships, not the graph vertex.
```

### Edges (directed, both directions stored)

```
g.V(personAId).addE('spouse').to(g.V(personBId))
g.V(parentId).addE('parent_of').to(g.V(childId))
g.V(childId).addE('child_of').to(g.V(parentId))
g.V(personAId).addE('sibling_of').to(g.V(personBId))
g.V(personAId).addE('in_law_of').to(g.V(personBId))
g.V(personAId).addE('step_parent_of').to(g.V(personBId))
g.V(personAId).addE('adoptive_parent_of').to(g.V(personBId))
```

### Key traversal queries (use in `GraphTraversalService.cs`)

```groovy
// 1 level up + 1 level down from a person
g.V().has('person','personId', personId)
  .union(
    __.in('parent_of'),               // parents
    __.out('parent_of'),              // children
    __.both('spouse')                 // spouses
  ).valueMap(true)

// Expand N levels up
g.V().has('person','personId', personId).repeat(__.in('parent_of')).times(n).valueMap(true)

// Shortest path between two persons (cross-tree surname link detection)
g.V().has('person','personId', aId)
  .repeat(__.both().simplePath()).until(__.has('person','personId', bId))
  .path().limit(1)
```

---

## API endpoint catalogue

All endpoints are prefixed `/api/v1`. Auth header: `Authorization: Bearer <jwt>`.

### Persons

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/persons/{id}` | Any | Get person by ID |
| GET | `/persons/{id}/detail` | Any | Get full PersonDetail |
| POST | `/persons` | FamilyAdmin, PowerAdmin | Create person |
| PUT | `/persons/{id}` | FamilyAdmin, PowerAdmin | Update person |
| DELETE | `/persons/{id}` | PowerAdmin | Soft-delete |
| POST | `/persons/{id}/photo-upload-url` | FamilyAdmin, PowerAdmin | Get SAS URL for direct Blob upload |

### Tree & graph

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/trees` | Any | List all family trees (id, surname, member count) |
| POST | `/trees` | PowerAdmin | Create new family tree |
| GET | `/trees/{treeId}/node/{personId}` | Any | Get node + N levels up/down (query param `levels`, default 1). Joins `PersonTreeMemberships` to confirm person is in tree. |
| POST | `/trees/{treeId}/relationships` | FamilyAdmin, PowerAdmin | Add relationship edge between two persons |
| POST | `/trees/{treeId}/members/{personId}` | FamilyAdmin, PowerAdmin | Link an existing person into this tree (cross-tree membership) |
| DELETE | `/trees/{treeId}/members/{personId}` | PowerAdmin | Remove a person's membership from a tree |
| GET | `/persons/search-existing?q={name}&nameBefore={surname}` | FamilyAdmin, PowerAdmin | Search existing persons before creating a duplicate — use when adding a cross-tree member |

### Surnames

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/surnames` | Any | List all distinct surnames with tree metadata |
| GET | `/surnames/relationships` | Any | List all auto-detected surname cross-links |
| GET | `/surnames/{surname}/recent` | Any | Most recent living member of surname |

### Search

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/search?q={name}&surname={surname}` | Any | Full-text search across persons |

### Admin

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/admin/users` | PowerAdmin | List all users |
| PUT | `/admin/users/{id}/role` | PowerAdmin | Change user role |
| DELETE | `/admin/users/{id}` | PowerAdmin | Remove user |
| POST | `/admin/trees/{treeId}/admins/{userId}` | PowerAdmin | Assign FamilyAdmin to tree |
| GET | `/admin/audit-log` | PowerAdmin | Paginated audit log |

---

## Frontend component guide

### TreePage layout

```
┌──────────────────────────────────────────────────┐
│  TopBar: logo | search | language switcher | user│
├────────────┬─────────────────────────────────────┤
│ Left pane  │  Tree canvas (React Flow)           │
│            │                                     │
│ Surnames   │  [PersonNode]──[PersonNode]         │
│ • Sathe    │       │                             │
│ • Panse    │  [PersonNode]                       │
│ • …        │                                     │
│            │                 [+][-] expand btns  │
└────────────┴─────────────────────────────────────┘
```

### PersonNode component (React Flow custom node)

```tsx
// src/components/tree/PersonNode.tsx
interface PersonNodeData {
  personId: string;
  fullName: string;
  photoUrl: string;
  location: string;
  birthMonthYear: string;
  deathMonthYear?: string;
  expanded: boolean;
}

// Render: Avatar (60×60) + name below
// Hover: Tooltip with location, birth, death
// Double-click: navigate('/person/:id')
// +/- button: dispatch expand/collapse action to Zustand store
```

### State management (Zustand)

```ts
// src/store/treeStore.ts
interface TreeStore {
  activeFamilyTreeId: string | null;
  nodes: Node[];           // React Flow nodes
  edges: Edge[];           // React Flow edges
  expandedPersonIds: Set<string>;
  setActiveTree: (id: string) => void;
  expandNode: (personId: string, levels: number) => Promise<void>;
  collapseNode: (personId: string) => void;
}
```

### i18n setup

```ts
// src/i18n/index.ts
import i18n from 'i18next';
// Namespaces: common, tree, person, admin
// Languages: en, hi, mr
// Language preference stored in localStorage
```

---

## Surname cross-link detection (background job)

Run as a hosted service (`IHostedService`) in the API or as an Azure Function on a timer (daily).

**Algorithm:**
1. Query `PersonTreeMemberships` in SQL for persons who appear in **two or more distinct trees**.
2. For each such person, look up their Cosmos DB vertex and check for `spouse` edges that cross tree boundaries (i.e. spouse's `primaryTreeId` differs from this person's `primaryTreeId`).
3. Also detect via `NameBefore`: if `Persons.NameBefore` matches a known `FamilyTrees.Surname`, that is a candidate cross-link — verify by checking `PersonTreeMemberships` for dual membership.
4. For each confirmed cross-tree pair, run BFS in Cosmos DB from the link person outward in both directions, counting hops to each surname's root ancestor → store as `relationship_level`.
5. Deduplicate: only keep the shortest path between each `(SurnameA, SurnameB)` pair.
6. Upsert into `SurnameLinks` table (the `UQ_SurnameLink` constraint handles idempotency).
7. Expose via `GET /surnames/relationships`.

**Example — Tara Panse married into Sathe tree:**
- `PersonTreeMemberships` shows Tara has rows for both `SatheTree` and `PanseTree`.
- BFS from Tara: 1 hop to Ravi (Sathe root direction), 1 hop to Shri Panse (Panse root direction).
- `SurnameLinks` row: `SurnameA=Sathe, SurnameB=Panse, LinkPersonId=Tara, RelationshipLevel=2`.

---

## Photo upload flow

```
1. Client calls POST /persons/{id}/photo-upload-url
2. API generates Azure Blob SAS token (write, 15 min TTL), returns { sasUrl, blobName }
3. Client PUT file bytes directly to sasUrl (no API bandwidth used)
4. Client calls PUT /persons/{id} with { photoBlobUrl: "<CDN base>/<blobName>" }
5. API saves CDN URL to SQL, updates Cosmos vertex property
```

Container name: `person-photos`. CDN endpoint served via Azure CDN (cache TTL 24h).

---

## Audit log implementation

In `AuditMiddleware.cs` or called explicitly from each service method:

```csharp
public async Task LogAsync(
    Guid userId, string entityType, Guid entityId,
    string action, object? oldValue, object? newValue)
{
    var entry = new AuditLog {
        UserId = userId,
        EntityType = entityType,
        EntityId = entityId,
        Action = action,
        OldValue = oldValue is null ? null : JsonSerializer.Serialize(oldValue),
        NewValue = newValue is null ? null : JsonSerializer.Serialize(newValue),
        ChangedAt = DateTime.UtcNow
    };
    _db.AuditLog.Add(entry);
    await _db.SaveChangesAsync();
}
```

Call before and after every `PersonService`, `TreeService`, and `UserService` mutation.

---

## Environment variables & secrets

Store in Azure App Configuration / Key Vault. Never commit secrets.

**Backend `appsettings.json` keys (values from Key Vault)**

```json
{
  "AzureSQL": {
    "ConnectionString": ""
  },
  "CosmosDb": {
    "GremlinEndpoint": "",
    "PrimaryKey": "",
    "Database": "familytree",
    "Container": "relationships"
  },
  "AzureBlob": {
    "ConnectionString": "",
    "ContainerName": "person-photos",
    "CdnBaseUrl": ""
  },
  "AzureAdB2C": {
    "Instance": "https://<tenant>.b2clogin.com",
    "ClientId": "",
    "Domain": "<tenant>.onmicrosoft.com",
    "SignUpSignInPolicyId": "B2C_1_signupsignin"
  }
}
```

**Frontend `.env`**

```
VITE_API_BASE_URL=https://api.familytree.example.com/api/v1
VITE_BLOB_CDN_BASE=https://cdn.familytree.example.com
VITE_B2C_CLIENT_ID=
VITE_B2C_AUTHORITY=https://<tenant>.b2clogin.com/<tenant>.onmicrosoft.com/B2C_1_signupsignin
VITE_B2C_REDIRECT_URI=https://familytree.example.com
```

---

## Key design decisions & constraints

| Decision | Rationale |
|---|---|
| Cosmos DB Gremlin for relationships | Efficient graph traversal for multi-level expansion and shortest-path surname linking without recursive SQL CTEs |
| Extended_fields JSON column | Person and PersonDetail can gain new fields without migrations — store arbitrary future fields as JSON |
| Azure AD B2C for auth | Managed service — handles email+password, MFA, token refresh, role claims |
| SAS token direct upload | Keeps large file bytes off the API server; reduces bandwidth costs |
| React Flow for tree canvas | Battle-tested graph canvas library; supports custom nodes, edges, minimap, zoom/pan |
| Zustand for state | Lightweight; avoids Redux boilerplate for tree expand/collapse state |
| i18next | Industry standard; supports namespace splitting per feature area |
| Lazy load PersonDetail | PersonDetail is only fetched on double-click; keeps tree canvas fast |
| `relationship_level` in SurnameLinks | Pre-computed by nightly job to avoid expensive real-time BFS on every page load |
| `PersonTreeMemberships` junction table | A person (e.g. a woman who marries across trees) must have exactly one `Persons` row. Duplicating rows breaks search, audit, and identity. The junction table records which trees she appears in without duplicating her data. |
| `PrimaryTreeId` on `Persons` | Nullable FK to the tree where the person was first entered. Used as a display hint and admin ownership hint — not for tree membership queries (always use `PersonTreeMemberships` for that). |
| Search before create (cross-tree add) | When a FamilyAdmin adds a person to their tree, the UI must first call `GET /persons/search-existing` to find an existing person record. Only if no match is found should a new `Person` row be created. This prevents the Tara-duplicate problem at the UI layer. |

---

## Non-functional requirements

| NFR | Target |
|---|---|
| API response time (tree node load) | < 500ms p95 |
| API response time (search) | < 1s p95 |
| Tree canvas initial render | < 2s on 3G |
| Photo upload size | Max 5MB per photo |
| Audit log retention | 2 years |
| Scalability | Azure App Service auto-scale; Cosmos DB serverless or provisioned RU |
| Accessibility | WCAG 2.1 AA — keyboard navigation, screen reader labels on all nodes |
| Security | All endpoints require valid JWT; HTTPS only; CORS restricted to frontend origin |

---

## Coding conventions

- **C#**: Use record types for DTOs, `Result<T>` pattern for service return values, async/await throughout, XML doc comments on all public methods.
- **TypeScript**: Strict mode on. No `any`. All API responses typed via generated or hand-written interfaces in `src/types/`.
- **React**: Functional components only. Hooks in `src/hooks/`. No class components.
- **CSS**: TailwindCSS utility classes. Custom design tokens in `tailwind.config.ts`. No inline styles except dynamic values.
- **Testing**: xUnit for backend unit tests. Vitest + React Testing Library for frontend. Integration tests for all API endpoints.
- **Commits**: Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`).

---

## Claude Code working conventions for this repo

These conventions reduce token usage and avoid common inefficiencies observed in past sessions. Follow them by default unless the user explicitly overrides.

- **Batch independent operations.** Multiple Reads, Greps, or shell checks with no data dependency must be issued in a single message with parallel tool calls — never as separate sequential turns.

- **Prefer dedicated tools over Bash.** Use Glob for listing files, Read for viewing file contents, Grep for searching, Edit for modifications. Reserve Bash/PowerShell for actual shell operations (git, dotnet, npm, docker). Specifically: never use `cat`, `ls`, `find`, `grep`, or `sed` via Bash when the dedicated tool fits.

- **Don't re-read files already in context.** After a Read or Edit in this session, treat the file's current content as still loaded. Only re-read if the user mentions an external change or you have specific reason to believe the file changed.

- **Filter build/test output by default.**
  - Backend tests: `dotnet test --logger "console;verbosity=minimal"`
  - Frontend tests: `vitest run --reporter=dot`
  - Frontend build: `npm run build` — on success report a single line (file count or "OK"); on failure show only error lines (pipe through `Select-String -Pattern "error|Failed|FAIL"`).
  - Never use `--verbosity detailed` or unfiltered build dumps.

- **Edit before Write.** If the file exists and the change is partial, use Edit (or Edit with `replace_all`) rather than rewriting the whole file. Batch multiple Edits to the same file in a single message.

- **Delegate multi-file investigations.** If a request will require reading more than 3 files or running more than 5 search/grep calls to answer, spawn an Agent (Explore for searches, general-purpose for research). Ask the agent to return a summary under 300 words with file:line citations — do not dump full file contents back into the parent thread.

- **Use available skills.** Prefer `/run` to launch the app, `/verify` to confirm a change works, `/code-review` or `/review` for code reviews, `/security-review` for pre-commit security checks. Do not hand-roll equivalents (manual `npm run dev &` + polling loops, multi-agent code-review orchestration, etc.).

- **Shell hygiene (Windows).** Never prepend `cd <dir> &&` to a shell command — `cd` does not persist across calls. Use absolute paths instead. Do not append `2>&1 | tail -N` to commands; the harness already truncates output. Pick one shell (PowerShell preferred on this repo) and stick with it within a single task.

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
- 17 persons across 4 generations, using `PersonTreeMemberships` (no `FamilyTreeId` on `Persons`)
- Meena has two `PersonTreeMemberships` rows: one for Sathe (married_in), one for Panse (member)
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
Meena PersonTreeMemberships: (Meena, SatheTree, 'married_in') + (Meena, PanseTree, 'member')
Meena Persons row: one row only — PrimaryTreeId = SatheTree (first tree she was added to)
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

---

## Out of scope (phase 1)

- GEDCOM import/export
- Native mobile app
- Email notifications on edits
- Version history / record revert
- Dark mode toggle (follow OS preference only)

---

*Last updated: generated during architecture design session — updated with local dev & mock data — updated with PersonTreeMemberships cross-tree identity fix.*
*Owner: Power Admin / Project Lead*
