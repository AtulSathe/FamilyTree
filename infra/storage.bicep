@description('Base application name used in resource naming')
param appName string

@description('Deployment environment: dev or prod')
@allowed(['dev', 'prod'])
param environment string

@description('Azure region for all resources')
param location string

// Storage account names: max 24 chars, lowercase, no hyphens
var storageAccountName = toLower(take(replace('${appName}storage${environment}', '-', ''), 24))
var containerName      = 'person-photos'
var cdnProfileName     = '${appName}-cdn-${environment}'
var cdnEndpointName    = '${appName}-ep-${environment}'

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: true
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    cors: {
      corsRules: [
        {
          // Allow direct PUT uploads from the browser (SAS token flow)
          allowedOrigins: ['*']
          allowedMethods: ['GET', 'PUT', 'OPTIONS']
          maxAgeInSeconds: 3600
          allowedHeaders: ['*']
          exposedHeaders: ['ETag', 'Content-Length']
        }
      ]
    }
  }
}

resource photoContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: containerName
  properties: {
    // Blobs served publicly through CDN; SAS tokens protect writes
    publicAccess: 'Blob'
  }
}

resource cdnProfile 'Microsoft.Cdn/profiles@2023-05-01' = {
  name: cdnProfileName
  location: 'global'
  sku: { name: 'Standard_Microsoft' }
}

resource cdnEndpoint 'Microsoft.Cdn/profiles/endpoints@2023-05-01' = {
  parent: cdnProfile
  name: cdnEndpointName
  location: 'global'
  properties: {
    originHostHeader: '${storageAccountName}.blob.core.windows.net'
    isHttpAllowed: false
    isHttpsAllowed: true
    queryStringCachingBehavior: 'IgnoreQueryString'
    isCompressionEnabled: true
    contentTypesToCompress: [
      'image/jpeg'
      'image/png'
      'image/webp'
    ]
    origins: [
      {
        name: 'blob-origin'
        properties: {
          hostName: '${storageAccountName}.blob.core.windows.net'
          httpsPort: 443
          originHostHeader: '${storageAccountName}.blob.core.windows.net'
          priority: 1
          weight: 1000
        }
      }
    ]
    deliveryPolicy: {
      rules: [
        {
          name: 'CachePhotos'
          order: 1
          conditions: [
            {
              name: 'UrlPath'
              parameters: {
                typeName: 'DeliveryRuleUrlPathMatchConditionParameters'
                operator: 'BeginsWith'
                matchValues: ['/${containerName}/']
                transforms: []
                negateCondition: false
              }
            }
          ]
          actions: [
            {
              name: 'CacheExpiration'
              parameters: {
                typeName: 'DeliveryRuleCacheExpirationActionParameters'
                cacheBehavior: 'Override'
                cacheType: 'All'
                cacheDuration: '1.00:00:00'  // 24-hour CDN cache per CLAUDE.md NFR
              }
            }
          ]
        }
      ]
    }
  }
}

@secure()
output storageConnectionString string = 'DefaultEndpointsProtocol=https;AccountName=${storageAccountName};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net'
output cdnBaseUrl string = 'https://${cdnEndpoint.properties.hostName}'
output storageAccountName string = storageAccountName
