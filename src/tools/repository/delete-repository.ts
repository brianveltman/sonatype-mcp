import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { RepositoryService } from '../../services/repositories.js';
import { formatMCPError } from '../../utils/errors.js';
import { z } from 'zod';
import { validateInput } from '../../utils/validation.js';

const deleteRepositorySchema = z.object({
  name: z.string().min(1, 'Repository name is required').max(100)
}).strict();

/**
 * Delete repository tool
 */
export function createDeleteRepositoryTool(repositoryService: RepositoryService): Tool {
  return {
    name: 'nexus_delete_repository',
    description: 'Delete a repository (requires write mode)',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Repository name to delete',
          minLength: 1,
          maxLength: 100
        }
      },
      required: ['name'],
      additionalProperties: false
    },
    handler: async (params: any) => {
      try {
        const { name } = validateInput(deleteRepositorySchema, params);
        await repositoryService.deleteRepository(name);
        
        return {
          content: [
            {
              type: 'text',
              text: `Repository '${name}' has been deleted successfully.`
            }
          ]
        };
      } catch (error) {
        const mcpError = formatMCPError(error as Error);
        return {
          content: [
            {
              type: 'text',
              text: `Error deleting repository: ${mcpError.message}`
            }
          ],
          isError: true
        };
      }
    }
  };
}