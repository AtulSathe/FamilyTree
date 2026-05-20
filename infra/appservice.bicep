@description('Base application name used in resource naming')
param appName string

@description('Deployment environment: dev or prod')
@allowed(['dev', 'prod'])
param environment string

@description('Azure region for all resources')
param location string

// ── SQL ──────────────────────────────────────────────────────────────────────
@secure()
param sqlConnectionString string

// ── Cosmos DB Gremlin ────────────────────────────────────────────────────────
param cosmosGremlinEndpoint string
param cosmosGremlinPort     int    = 443
param cosmosGremlinUsername string
@secure()
param cosmosGremlinPassword string
param cosmosDatabase        string = 'familytree'
param cosmosContainer       string = 'relationships'

// ── Blob Storage ─────────────────────────────────────────────────────────────
@secure()
param storageConnectionString string
param storageCdnBaseUrl       string

// ── Azure AD B2C ─────────────────────────────────────────────────────────────
param b2cClientId    string
param b2cDomain      string
param b2cPolicyId    string = 'B2C_1_signupsignin'

// ── CORS ─────────────────────────────────────────────────────────────────────
param allowedOrigin string = ''   // set to Static Web App URL after first deploy

var planName       = '${appName}-plan-${environment}'
var apiAppName     = '${appName}-api-${environment}'
var swaName        = '${appName}-web-${environment}'

// ── App Service Plan — Linux ──────────────────────────────────────────────────
resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: planName
  location: location
  sku: {
    name: environment == 'prod' ? 'B2' : 'B1'
    tier: 'Basic'
  }
  kind: 'linux'
  properties: {
    reserved: true   // required for Linux
  }
}

// ── Backend API — App Service ─────────────────────────────────────────────────
resource apiApp 'Microsoft.Web/sites@2023-12-01' = {
  name: apiAppName
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|8.0'
      alwaysOn: true
      ftpsState: 'Disabled'
      http20Enabled: true
      // Environment variables for .NET configuration (double-underscore = colon separator)
      appSettings: [
        { name: 'ASPNETCORE_ENVIRONMENT',          value: environment == 'prod' ? 'Production' : 'Development' }
        { name: 'USE_MOCK_AUTH',                   value: 'false' }
        { name: 'AzureSQL__ConnectionString',      value: sqlConnectionString }
        { name: 'CosmosDb__GremlinEndpoint',       value: cosmosGremlinEndpoint }
        { name: 'CosmosDb__GremlinPort',           value: string(cosmosGremlinPort) }
        { name: 'CosmosDb__GremlinUsername',       value: cosmosGremlinUsername }
        { name: 'CosmosDb__GremlinPassword',       value: cosmosGremlinPassword }
        { name: 'CosmosDb__EnableSsl',             value: 'true' }
        { name: 'CosmosDb__Database',              value: cosmosDatabase }
        { name: 'CosmosDb__Container',             value: cosmosContainer }
        { name: 'AzureBlob__ConnectionString',     value: storageConnectionString }
        { name: 'AzureBlob__ContainerName',        value: 'person-photos' }
        { name: 'AzureBlob__CdnBaseUrl',           value: storageCdnBaseUrl }
        { name: 'AzureAdB2C__Instance',            value: 'https://${b2cDomain}.b2clogin.com' }
        { name: 'AzureAdB2C__ClientId',            value: b2cClientId }
        { name: 'AzureAdB2C__Domain',              value: '${b2cDomain}.onmicrosoft.com' }
        { name: 'AzureAdB2C__SignUpSignInPolicyId', value: b2cPolicyId }
        { name: 'AllowedOrigin',                   value: allowedOrigin }
        { name: 'WEBSITE_RUN_FROM_PACKAGE',        value: '1' }
      ]
    }
  }
}

// ── Frontend — Azure Static Web Apps ─────────────────────────────────────────
// Note: Static Web Apps is available in limited regions.
// If the target region isn't supported, use 'eastus2' or 'westus2'.
resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: swaName
  // SWA has limited region availability — fall back to eastus2 if location unsupported
  location: contains(['eastus2', 'westus2', 'centralus', 'westeurope', 'eastasia'], location)
    ? location
    : 'eastus2'
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    // GitHub integration is configured in the CI workflow (azure_static_web_apps_api_token)
    buildProperties: {
      skipGithubActionWorkflowGeneration: true
    }
  }
}

output apiUrl           string = 'https://${apiApp.properties.defaultHostName}'
output apiAppName       string = apiAppName
output staticWebAppUrl  string = 'https://${staticWebApp.properties.defaultHostname}'
@secure()
output staticWebAppDeployToken string = staticWebApp.listSecrets().properties.apiKey
