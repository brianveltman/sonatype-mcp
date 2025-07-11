import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { RepositoryService } from '../../services/repositories.js';
import { formatMCPError } from '../../utils/errors.js';
import { z } from 'zod';
import { validateInput, commonSchemas } from '../../utils/validation.js';

/**
 * Update repository tool input schema
 */
const updateRepositorySchema = z.object({
  name: commonSchemas.repositoryName,
  online: z.boolean().optional(),
  storage: z.object({
    blobStoreName: z.string().optional(),
    strictContentTypeValidation: z.boolean().optional(),
    writePolicy: z.enum(['allow', 'allow_once', 'deny']).optional()
  }).optional(),
  cleanup: z.object({
    policyNames: z.array(z.string()).optional()
  }).optional(),
  // Proxy-specific fields
  proxy: z.object({
    remoteUrl: z.string().optional(),
    contentMaxAge: z.number().optional(),
    metadataMaxAge: z.number().optional()
  }).optional(),
  negativeCache: z.object({
    enabled: z.boolean().optional(),
    timeToLive: z.number().optional()
  }).optional(),
  httpClient: z.object({
    blocked: z.boolean().optional(),
    autoBlock: z.boolean().optional(),
    connection: z.object({
      retries: z.number().optional(),
      userAgentSuffix: z.string().optional(),
      timeout: z.number().optional(),
      enableCircularRedirects: z.boolean().optional(),
      enableCookies: z.boolean().optional(),
      useTrustStore: z.boolean().optional()
    }).optional(),
    authentication: z.object({
      type: z.enum(['username', 'ntlm', 'bearerToken']).optional(),
      username: z.string().optional(),
      password: z.string().optional(),
      ntlmHost: z.string().optional(),
      ntlmDomain: z.string().optional(),
      bearerToken: z.string().optional()
    }).optional()
  }).optional(),
  // Group-specific fields
  group: z.object({
    memberNames: z.array(z.string()).optional(),
    writableMember: z.string().optional()
  }).optional(),
  // Format-specific fields
  maven: z.object({
    versionPolicy: z.enum(['RELEASE', 'SNAPSHOT', 'MIXED']).optional(),
    layoutPolicy: z.enum(['STRICT', 'PERMISSIVE']).optional(),
    contentDisposition: z.enum(['INLINE', 'ATTACHMENT']).optional()
  }).optional(),
  docker: z.object({
    v1Enabled: z.boolean().optional(),
    forceBasicAuth: z.boolean().optional(),
    httpPort: z.number().optional(),
    httpsPort: z.number().optional(),
    subdomain: z.string().optional()
  }).optional(),
  npm: z.object({
    removeNonCataloged: z.boolean().optional(),
    removeQuarantined: z.boolean().optional()
  }).optional(),
  pypi: z.object({
    removeNonCataloged: z.boolean().optional(),
    removeQuarantined: z.boolean().optional()
  }).optional(),
  nuget: z.object({
    nugetVersion: z.enum(['V2', 'V3']).optional(),
    queryCacheItemMaxAge: z.number().optional()
  }).optional()
}).strict();

/**
 * Update repository tool
 */
export function createUpdateRepositoryTool(repositoryService: RepositoryService): Tool {
  return {
    name: 'nexus_update_repository',
    description: 'Update an existing repository configuration in Nexus Repository Manager (requires write mode)',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Repository name to update'
        },
        online: {
          type: 'boolean',
          description: 'Whether the repository is online'
        },
        storage: {
          type: 'object',
          description: 'Storage configuration',
          properties: {
            blobStoreName: {
              type: 'string',
              description: 'Blob store name'
            },
            strictContentTypeValidation: {
              type: 'boolean',
              description: 'Enable strict content type validation'
            },
            writePolicy: {
              type: 'string',
              description: 'Write policy for hosted repositories',
              enum: ['allow', 'allow_once', 'deny']
            }
          },
          additionalProperties: false
        },
        cleanup: {
          type: 'object',
          description: 'Cleanup policies configuration',
          properties: {
            policyNames: {
              type: 'array',
              description: 'List of cleanup policy names to apply',
              items: {
                type: 'string'
              }
            }
          },
          additionalProperties: false
        },
        proxy: {
          type: 'object',
          description: 'Proxy repository configuration',
          properties: {
            remoteUrl: {
              type: 'string',
              description: 'URL of the remote repository to proxy'
            },
            contentMaxAge: {
              type: 'number',
              description: 'How long to cache artifacts before rechecking (minutes)'
            },
            metadataMaxAge: {
              type: 'number',
              description: 'How long to cache metadata before rechecking (minutes)'
            }
          },
          additionalProperties: false
        },
        negativeCache: {
          type: 'object',
          description: 'Negative cache configuration for proxy repositories',
          properties: {
            enabled: {
              type: 'boolean',
              description: 'Enable negative cache'
            },
            timeToLive: {
              type: 'number',
              description: 'How long to cache failures (minutes)'
            }
          },
          additionalProperties: false
        },
        httpClient: {
          type: 'object',
          description: 'HTTP client configuration for proxy repositories',
          properties: {
            blocked: {
              type: 'boolean',
              description: 'Block outbound connections'
            },
            autoBlock: {
              type: 'boolean',
              description: 'Auto-block when remote peer is detected as unreachable'
            },
            connection: {
              type: 'object',
              properties: {
                retries: {
                  type: 'number',
                  description: 'Connection retry attempts'
                },
                userAgentSuffix: {
                  type: 'string',
                  description: 'Custom user agent suffix'
                },
                timeout: {
                  type: 'number',
                  description: 'Connection timeout in seconds'
                },
                enableCircularRedirects: {
                  type: 'boolean',
                  description: 'Enable circular redirects'
                },
                enableCookies: {
                  type: 'boolean',
                  description: 'Enable cookies'
                },
                useTrustStore: {
                  type: 'boolean',
                  description: 'Use trust store for certificate verification'
                }
              },
              additionalProperties: false
            },
            authentication: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['username', 'ntlm', 'bearerToken'],
                  description: 'Authentication type'
                },
                username: {
                  type: 'string',
                  description: 'Username for authentication'
                },
                password: {
                  type: 'string',
                  description: 'Password for authentication'
                },
                ntlmHost: {
                  type: 'string',
                  description: 'NTLM host'
                },
                ntlmDomain: {
                  type: 'string',
                  description: 'NTLM domain'
                },
                bearerToken: {
                  type: 'string',
                  description: 'Bearer token for authentication'
                }
              },
              additionalProperties: false
            }
          },
          additionalProperties: false
        },
        group: {
          type: 'object',
          description: 'Group repository configuration',
          properties: {
            memberNames: {
              type: 'array',
              description: 'Member repository names',
              items: {
                type: 'string'
              }
            },
            writableMember: {
              type: 'string',
              description: 'Member repository for write operations'
            }
          },
          additionalProperties: false
        },
        maven: {
          type: 'object',
          description: 'Maven-specific configuration',
          properties: {
            versionPolicy: {
              type: 'string',
              description: 'Version policy',
              enum: ['RELEASE', 'SNAPSHOT', 'MIXED']
            },
            layoutPolicy: {
              type: 'string',
              description: 'Layout policy',
              enum: ['STRICT', 'PERMISSIVE']
            },
            contentDisposition: {
              type: 'string',
              description: 'Content disposition',
              enum: ['INLINE', 'ATTACHMENT']
            }
          },
          additionalProperties: false
        },
        docker: {
          type: 'object',
          description: 'Docker-specific configuration',
          properties: {
            v1Enabled: {
              type: 'boolean',
              description: 'Enable Docker V1 API'
            },
            forceBasicAuth: {
              type: 'boolean',
              description: 'Force basic authentication'
            },
            httpPort: {
              type: 'number',
              description: 'HTTP port'
            },
            httpsPort: {
              type: 'number',
              description: 'HTTPS port'
            },
            subdomain: {
              type: 'string',
              description: 'Repository subdomain'
            }
          },
          additionalProperties: false
        },
        npm: {
          type: 'object',
          description: 'npm-specific configuration',
          properties: {
            removeNonCataloged: {
              type: 'boolean',
              description: 'Remove non-cataloged versions from metadata'
            },
            removeQuarantined: {
              type: 'boolean',
              description: 'Remove quarantined versions from metadata'
            }
          },
          additionalProperties: false
        },
        pypi: {
          type: 'object',
          description: 'PyPI-specific configuration',
          properties: {
            removeNonCataloged: {
              type: 'boolean',
              description: 'Remove non-cataloged versions from metadata'
            },
            removeQuarantined: {
              type: 'boolean',
              description: 'Remove quarantined versions from metadata'
            }
          },
          additionalProperties: false
        },
        nuget: {
          type: 'object',
          description: 'NuGet-specific configuration',
          properties: {
            nugetVersion: {
              type: 'string',
              description: 'NuGet protocol version',
              enum: ['V2', 'V3']
            },
            queryCacheItemMaxAge: {
              type: 'number',
              description: 'Query cache item max age in seconds'
            }
          },
          additionalProperties: false
        }
      },
      required: ['name'],
      additionalProperties: false
    },
    handler: async (params: any) => {
      try {
        const validParams = validateInput(updateRepositorySchema, params);
        
        // Get the current repository to determine format and type
        const currentRepo = await repositoryService.getRepository(validParams.name);
        
        // Build the update configuration
        const updateConfig: any = {};
        
        // Only include fields that are being updated
        if (validParams.online !== undefined) {
          updateConfig.online = validParams.online;
        }
        
        if (validParams.storage) {
          updateConfig.storage = validParams.storage;
        }
        
        if (validParams.cleanup) {
          updateConfig.cleanup = validParams.cleanup;
        }
        
        // Add type-specific updates
        if (currentRepo.type === 'proxy') {
          if (validParams.proxy) {
            updateConfig.proxy = validParams.proxy;
          }
          if (validParams.negativeCache) {
            updateConfig.negativeCache = validParams.negativeCache;
          }
          if (validParams.httpClient) {
            updateConfig.httpClient = validParams.httpClient;
          }
        } else if (currentRepo.type === 'group') {
          if (validParams.group) {
            updateConfig.group = validParams.group;
          }
        }
        
        // Add format-specific updates
        switch (currentRepo.format) {
          case 'maven2':
            if (validParams.maven) {
              updateConfig.maven = validParams.maven;
            }
            break;
          case 'docker':
            if (validParams.docker) {
              updateConfig.docker = validParams.docker;
            }
            break;
          case 'npm':
            if (validParams.npm) {
              updateConfig.npm = validParams.npm;
            }
            break;
          case 'pypi':
            if (validParams.pypi) {
              updateConfig.pypi = validParams.pypi;
            }
            break;
          case 'nuget':
            if (validParams.nuget) {
              updateConfig.nuget = validParams.nuget;
            }
            break;
        }
        
        // Update the repository using the format-specific endpoint
        const endpoint = `/service/rest/v1/repositories/${currentRepo.format}/${currentRepo.type}/${encodeURIComponent(validParams.name)}`;
        await repositoryService.nexusClient.put(endpoint, updateConfig);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                message: `Repository '${validParams.name}' updated successfully`,
                repository: {
                  name: validParams.name,
                  format: currentRepo.format,
                  type: currentRepo.type
                }
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        const mcpError = formatMCPError(error as Error);
        return {
          content: [
            {
              type: 'text',
              text: `Error updating repository: ${mcpError.message}`
            }
          ],
          isError: true
        };
      }
    }
  };
}