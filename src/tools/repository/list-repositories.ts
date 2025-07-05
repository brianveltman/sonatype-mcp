import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { RepositoryService } from '../../services/repositories.js';
import { validateInput, listRepositoriesSchema } from '../../utils/validation.js';
import { formatMCPError } from '../../utils/errors.js';

/**
 * List repositories tool
 */
export function createListRepositoriesTool(repositoryService: RepositoryService): Tool {
  return {
    name: 'nexus_list_repositories',
    description: 'List all repositories in the Nexus Repository Manager',
    inputSchema: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          description: 'Filter by repository format (npm, maven2, nuget, pypi, docker, raw, yum, apt)',
          enum: ['npm', 'maven2', 'nuget', 'pypi', 'docker', 'raw', 'yum', 'apt']
        },
        type: {
          type: 'string',
          description: 'Filter by repository type',
          enum: ['hosted', 'proxy', 'group']
        }
      },
      additionalProperties: false
    },
    handler: async (params: any) => {
      try {
        const validParams = validateInput(listRepositoriesSchema, params);
        const repositories = await repositoryService.listRepositories(validParams);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                repositories,
                count: repositories.length
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
              text: `Error listing repositories: ${mcpError.message}`
            }
          ],
          isError: true
        };
      }
    }
  };
}