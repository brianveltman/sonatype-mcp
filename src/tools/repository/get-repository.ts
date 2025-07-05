import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { RepositoryService } from '../../services/repositories.js';
import { validateInput, getRepositorySchema } from '../../utils/validation.js';
import { formatMCPError } from '../../utils/errors.js';

/**
 * Get repository details tool
 */
export function createGetRepositoryTool(repositoryService: RepositoryService): Tool {
  return {
    name: 'nexus_get_repository',
    description: 'Get detailed information about a specific repository',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Repository name',
          minLength: 1,
          maxLength: 100
        }
      },
      required: ['name'],
      additionalProperties: false
    },
    handler: async (params: any) => {
      try {
        const { name } = validateInput(getRepositorySchema, params);
        const repository = await repositoryService.getRepository(name);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(repository, null, 2)
            }
          ]
        };
      } catch (error) {
        const mcpError = formatMCPError(error as Error);
        return {
          content: [
            {
              type: 'text',
              text: `Error getting repository: ${mcpError.message}`
            }
          ],
          isError: true
        };
      }
    }
  };
}