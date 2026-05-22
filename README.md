# FamilyTree — running locally

## Prerequisites

- Docker Desktop
- .NET 8 SDK
- Node.js 18+

## 1. Start local Azure dependencies (SQL Server, Gremlin, Azurite)

```bash
cd mock-data
docker compose up -d
docker compose ps    # wait until all services report healthy
```

## 2. Run the backend API

```bash
cd backend/FamilyTree.Api
```

Create `appsettings.Development.json` (not committed):

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

Apply migrations and start the API:

```bash
dotnet ef database update
dotnet run
```

API runs on `https://localhost:7001`. The seeder populates 2 trees and 17 persons on first start.

## 3. Run the frontend

### Option A — full stack (frontend + backend)

```bash
cd frontend
cp .env.example .env.local
```

Set `.env.local`:

```
VITE_API_BASE_URL=https://localhost:7001/api/v1
VITE_USE_MOCK=false
```

Then:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

### Option B — frontend only (MSW mock, no backend needed)

```bash
cd frontend
npx msw init public/ --save     # first time only
cp .env.example .env.local
```

Set `.env.local`:

```
VITE_USE_MOCK=true
```

Then:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. All API calls are mocked locally.

## Resetting local data

```bash
cd mock-data
docker compose stop sqlserver
docker volume rm mock-data_sqldata
docker compose up -d sqlserver
# in backend/FamilyTree.Api:
dotnet ef database update
dotnet run
```
