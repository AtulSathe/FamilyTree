// ═══════════════════════════════════════════════════════════════════════════
//  FamilyTree — Main Infrastructure Orchestrator
//  Deploy: az deployment group create -g <rg> -f infra/main.bicep -p @infra/main.params.json
// ═══════════════════════════════════════════════════════════════════════════

@description('Base name used in all resource names — keep short, lowercase, no spaces')
param appName string = 'familytree'

@description('Target environment')
@allowed(['dev', 'prod'])
param environment string = 'dev'

@description('Azure region')
param location string = resourceGroup().location

// ── SQL credentials ──────────────────────────────────────────────────────────
@description('SQL Server admin username')
param sqlAdminLogin string = 'ftadmin'

@description('SQL Server admin password — store in Key Vault, pass via secure parameter')
@secure()
param sqlAdminPassword string

// ── Azure AD B2C ─────────────────────────────────────────────────────────────
@description('Azure AD B2C app (client) ID')
param b2cClientId string

@description('Azure AD B2C tenant subdomain (e.g. "myfamilytree" for myfamilytree.b2clogin.com)')
param b2cDomain string

@description('B2C sign-up/sign-in user flow name')
param b2cPolicyId string = 'B2C_1_signupsignin'

// ── CORS ─────────────────────────────────────────────────────────────────────
@description('Frontend origin for CORS — leave empty on first deploy, update after SWA URL is known')
param allowedOrigin string = ''

// ════════════════════════════════════════════════════════════════════════════
//  Modules
// ════════════════════════════════════════════════════════════════════════════

module sql 'sql.bicep' = {
  name: 'sql-${environment}'
  params: {
    appName: appName
    environment: environment
    location: location
    sqlAdminLogin: sqlAdminLogin
    sqlAdminPassword: sqlAdminPassword
  }
}

module cosmos 'cosmos.bicep' = {
  name: 'cosmos-${environment}'
  params: {
    appName: appName
    environment: environment
    location: location
  }
}

module storage 'storage.bicep' = {
  name: 'storage-${environment}'
  params: {
    appName: appName
    environment: environment
    location: location
  }
}

module appservice 'appservice.bicep' = {
  name: 'appservice-${environment}'
  // App Service needs connection strings from SQL, Cosmos, and Storage
  dependsOn: [sql, cosmos, storage]
  params: {
    appName: appName
    environment: environment
    location: location
    sqlConnectionString:      sql.outputs.connectionString
    cosmosGremlinEndpoint:    cosmos.outputs.gremlinEndpoint
    cosmosGremlinPort:        cosmos.outputs.gremlinPort
    cosmosGremlinUsername:    cosmos.outputs.gremlinUsername
    cosmosGremlinPassword:    cosmos.outputs.primaryKey
    storageConnectionString:  storage.outputs.storageConnectionString
    storageCdnBaseUrl:        storage.outputs.cdnBaseUrl
    b2cClientId:              b2cClientId
    b2cDomain:                b2cDomain
    b2cPolicyId:              b2cPolicyId
    allowedOrigin:            allowedOrigin
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  Outputs — used by CI/CD and post-deploy configuration
// ════════════════════════════════════════════════════════════════════════════

output apiUrl          string = appservice.outputs.apiUrl
output staticWebAppUrl string = appservice.outputs.staticWebAppUrl
output cdnBaseUrl      string = storage.outputs.cdnBaseUrl
output sqlServerFqdn   string = sql.outputs.serverFqdn
output cosmosEndpoint  string = cosmos.outputs.gremlinEndpoint

// CI/CD uses this token to deploy the frontend SPA
@secure()
output staticWebAppDeployToken string = appservice.outputs.staticWebAppDeployToken
