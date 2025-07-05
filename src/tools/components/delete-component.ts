import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ComponentService } from '../../services/components.js';
import { formatMCPError } from '../../utils/errors.js';
import { z } from 'zod';
import { validateInput } from '../../utils/validation.js';

const deleteComponentSchema = z.object({
  id: z.string().min(1, 'Component ID is required')
}).strict();

/**
 * Delete component tool
 */
export function createDeleteComponentTool(componentService: ComponentService): Tool {
  return {
    name: 'nexus_delete_component',
    description: 'Delete a component (requires write mode)',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Component ID to delete',
          minLength: 1
        }
      },
      required: ['id'],
      additionalProperties: false
    },
    handler: async (params: any) => {
      try {
        const { id } = validateInput(deleteComponentSchema, params);
        await componentService.deleteComponent(id);
        
        return {
          content: [
            {
              type: 'text',
              text: `Component '${id}' has been deleted successfully.`
            }
          ]
        };
      } catch (error) {
        const mcpError = formatMCPError(error as Error);
        return {
          content: [
            {
              type: 'text',
              text: `Error deleting component: ${mcpError.message}`
            }
          ],
          isError: true
        };
      }
    }
  };
}