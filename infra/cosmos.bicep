@description('Base application name used in resource naming')
param appName string

@description('Deployment environment: dev or prod')
@allowed(['dev', 'prod'])
param environment string

@description('Azure region for all resources')
param location string

var accountName = '${appName}-cosmos-${environment}'
var dbName      = 'familytree'
var graphName   = 'relationships'

resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' = {
  name: accountName
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    capabilities: [
      { name: 'EnableGremlin' }
    ]
    databaseAccountOfferType: 'Standard'
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    // Serverless is cost-effective for low-traffic; switch to provisioned for predictable load
    enableFreeTier: environment == 'dev' ? true : false
    publicNetworkAccess: 'Enabled'
    disableKeyBasedMetadataWriteAccess: false
  }
}

resource gremlinDatabase 'Microsoft.DocumentDB/databaseAccounts/gremlinDatabases@2024-05-15' = {
  parent: cosmosAccount
  name: dbName
  properties: {
    resource: {
      id: dbName
    }
    // Only set throughput when not using serverless (free tier uses serverless billing)
    options: environment == 'dev' ? {} : { throughput: 400 }
  }
}

resource gremlinGraph 'Microsoft.DocumentDB/databaseAccounts/gremlinDatabases/graphs@2024-05-15' = {
  parent: gremlinDatabase
  name: graphName
  properties: {
    resource: {
      id: graphName
      partitionKey: {
        // Partition by primaryTreeId — most traversals are within one tree
        paths: ['/primaryTreeId']
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [{ path: '/*' }]
        excludedPaths: [{ path: '/"_etag"/?' }]
      }
    }
  }
}

// Gremlin endpoint: <account>.gremlin.cosmos.azure.com — port 443, SSL enabled
output gremlinEndpoint string  = '${accountName}.gremlin.cosmos.azure.com'
output gremlinPort      int    = 443
output gremlinUsername  string = '/dbs/${dbName}/colls/${graphName}'
// primaryKey is sensitive — used as GremlinPassword in the API
@secure()
output primaryKey string = cosmosAccount.listKeys().primaryMasterKey
