@description('Base application name used in resource naming')
param appName string

@description('Deployment environment: dev or prod')
@allowed(['dev', 'prod'])
param environment string

@description('Azure region for all resources')
param location string

@description('SQL Server administrator username')
param sqlAdminLogin string

@description('SQL Server administrator password')
@secure()
param sqlAdminPassword string

var serverName  = '${appName}-sql-${environment}'
var dbName      = '${appName}db'

resource sqlServer 'Microsoft.Sql/servers@2023-05-01-preview' = {
  name: serverName
  location: location
  properties: {
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
    version: '12.0'
    publicNetworkAccess: 'Enabled'
    minimalTlsVersion: '1.2'
  }
}

// Allow traffic from other Azure services (App Service, etc.)
resource allowAzureServices 'Microsoft.Sql/servers/firewallRules@2023-05-01-preview' = {
  parent: sqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-05-01-preview' = {
  parent: sqlServer
  name: dbName
  location: location
  sku: {
    // Basic tier — 5 DTUs; upgrade to S1+ for production load
    name: environment == 'prod' ? 'S1' : 'Basic'
    tier: environment == 'prod' ? 'Standard' : 'Basic'
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
  }
}

// Connection string for use by the App Service — double-underscores become colons in .NET config
output connectionString string = 'Server=${sqlServer.properties.fullyQualifiedDomainName},1433;Database=${dbName};User Id=${sqlAdminLogin};Password=${sqlAdminPassword};TrustServerCertificate=False;Encrypt=True'
output serverFqdn string = sqlServer.properties.fullyQualifiedDomainName
