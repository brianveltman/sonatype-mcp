import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { RepositoryService } from '../../services/repositories.js';
import { formatMCPError } from '../../utils/errors.js';
import { z } from 'zod';
import { validateInput, commonSchemas } from '../../utils/validation.js';

/**
 * Create repository tool input schema
 */
const createRepositorySchema = z.object({
  name: commonSchemas.repositoryName,
  format: commonSchemas.format,
  type: commonSchemas.repositoryType,
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
 * Create repository tool
 */
export function createCreateRepositoryTool(repositoryService: RepositoryService): Tool {
  return {
    name: 'nexus_create_repository',
    description: 'Create a new repository in Nexus Repository Manager (requires write mode)',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Unique repository identifier'
        },
        format: {
          type: 'string',
          description: 'Repository format',
          enum: ['npm', 'maven2', 'nuget', 'pypi', 'docker', 'raw', 'yum', 'apt']
        },
        type: {
          type: 'string',
          description: 'Repository type',
          enum: ['hosted', 'proxy', 'group']
        },
        online: {
          type: 'boolean',
          description: 'Whether the repository is online (default: true)'
        },
        storage: {
          type: 'object',
          description: 'Storage configuration',
          properties: {
            blobStoreName: {
              type: 'string',
              description: 'Blob store name (default: default)'
            },
            strictContentTypeValidation: {
              type: 'boolean',
              description: 'Enable strict content type validation (default: true)'
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
          description: 'Proxy repository configuration (required for proxy type)',
          properties: {
            remoteUrl: {
              type: 'string',
              description: 'URL of the remote repository to proxy'
            },
            contentMaxAge: {
              type: 'number',
              description: 'How long to cache artifacts before rechecking (minutes, default: 1440)'
            },
            metadataMaxAge: {
              type: 'number',
              description: 'How long to cache metadata before rechecking (minutes, default: 1440)'
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
              description: 'Enable negative cache (default: true)'
            },
            timeToLive: {
              type: 'number',
              description: 'How long to cache failures (minutes, default: 1440)'
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
              description: 'Block outbound connections (default: false)'
            },
            autoBlock: {
              type: 'boolean',
              description: 'Auto-block when remote peer is detected as unreachable (default: true)'
            },
            connection: {
              type: 'object',
              properties: {
                retries: {
                  type: 'number',
                  description: 'Connection retry attempts (default: 3)'
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
                  description: 'Enable circular redirects (default: false)'
                },
                enableCookies: {
                  type: 'boolean',
                  description: 'Enable cookies (default: false)'
                },
                useTrustStore: {
                  type: 'boolean',
                  description: 'Use trust store for certificate verification (default: false)'
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
          description: 'Group repository configuration (required for group type)',
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
              description: 'Enable Docker V1 API (default: false)'
            },
            forceBasicAuth: {
              type: 'boolean',
              description: 'Force basic authentication (default: true)'
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
      required: ['name', 'format', 'type'],
      additionalProperties: false
    },
    handler: async (params: any) => {
      try {
        const validParams = validateInput(createRepositorySchema, params);
        
        // Build the repository configuration based on type
        const repositoryConfig: any = {
          name: validParams.name,
          online: validParams.online ?? true
        };

        // Add storage configuration
        if (validParams.storage || validParams.type === 'hosted') {
          repositoryConfig.storage = {
            blobStoreName: validParams.storage?.blobStoreName ?? 'default',
            strictContentTypeValidation: validParams.storage?.strictContentTypeValidation ?? true
          };
          
          if (validParams.type === 'hosted' && validParams.storage?.writePolicy) {
            repositoryConfig.storage.writePolicy = validParams.storage.writePolicy;
          }
        }

        // Add cleanup configuration
        if (validParams.cleanup?.policyNames) {
          repositoryConfig.cleanup = {
            policyNames: validParams.cleanup.policyNames
          };
        }

        // Add type-specific configuration
        if (validParams.type === 'proxy') {
          if (!validParams.proxy?.remoteUrl) {
            throw new Error('Remote URL is required for proxy repositories');
          }
          
          repositoryConfig.proxy = {
            remoteUrl: validParams.proxy.remoteUrl,
            contentMaxAge: validParams.proxy.contentMaxAge ?? 1440,
            metadataMaxAge: validParams.proxy.metadataMaxAge ?? 1440
          };

          // Add negative cache configuration
          if (validParams.negativeCache !== undefined) {
            repositoryConfig.negativeCache = {
              enabled: validParams.negativeCache.enabled ?? true,
              timeToLive: validParams.negativeCache.timeToLive ?? 1440
            };
          }

          // Add HTTP client configuration
          if (validParams.httpClient) {
            repositoryConfig.httpClient = {
              blocked: validParams.httpClient.blocked ?? false,
              autoBlock: validParams.httpClient.autoBlock ?? true
            };

            if (validParams.httpClient.connection) {
              repositoryConfig.httpClient.connection = validParams.httpClient.connection;
            }

            if (validParams.httpClient.authentication) {
              repositoryConfig.httpClient.authentication = validParams.httpClient.authentication;
            }
          }
        } else if (validParams.type === 'group') {
          if (!validParams.group?.memberNames || validParams.group.memberNames.length === 0) {
            throw new Error('Member names are required for group repositories');
          }
          
          repositoryConfig.group = {
            memberNames: validParams.group.memberNames
          };

          if (validParams.group.writableMember) {
            repositoryConfig.group.writableMember = validParams.group.writableMember;
          }
        }

        // Add format-specific configuration
        switch (validParams.format) {
          case 'maven2':
            if (validParams.maven) {
              repositoryConfig.maven = {
                versionPolicy: validParams.maven.versionPolicy ?? 'MIXED',
                layoutPolicy: validParams.maven.layoutPolicy ?? 'STRICT',
                contentDisposition: validParams.maven.contentDisposition ?? 'ATTACHMENT'
              };
            }
            break;
          
          case 'docker':
            if (validParams.docker) {
              repositoryConfig.docker = {
                v1Enabled: validParams.docker.v1Enabled ?? false,
                forceBasicAuth: validParams.docker.forceBasicAuth ?? true
              };
              
              if (validParams.docker.httpPort) {
                repositoryConfig.docker.httpPort = validParams.docker.httpPort;
              }
              if (validParams.docker.httpsPort) {
                repositoryConfig.docker.httpsPort = validParams.docker.httpsPort;
              }
              if (validParams.docker.subdomain) {
                repositoryConfig.docker.subdomain = validParams.docker.subdomain;
              }
            }
            break;
          
          case 'npm':
            if (validParams.npm) {
              repositoryConfig.npm = validParams.npm;
            }
            break;
          
          case 'pypi':
            if (validParams.pypi) {
              repositoryConfig.pypi = validParams.pypi;
            }
            break;
          
          case 'nuget':
            if (validParams.nuget) {
              repositoryConfig.nuget = {
                nugetVersion: validParams.nuget.nugetVersion ?? 'V3',
                queryCacheItemMaxAge: validParams.nuget.queryCacheItemMaxAge ?? 3600
              };
            }
            break;
        }

        // Create the repository using the format-specific endpoint
        const endpoint = `/service/rest/v1/repositories/${validParams.format}/${validParams.type}`;
        await repositoryService.nexusClient.post(endpoint, repositoryConfig);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                message: `Repository '${validParams.name}' created successfully`,
                repository: {
                  name: validParams.name,
                  format: validParams.format,
                  type: validParams.type
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
              text: `Error creating repository: ${mcpError.message}`
            }
          ],
          isError: true
        };
      }
    }
  };
}