import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ComponentService } from '../../services/components.js';
import { validateInput, getComponentSchema } from '../../utils/validation.js';
import { formatMCPError } from '../../utils/errors.js';

/**
 * Get component details tool
 */
export function createGetComponentTool(componentService: ComponentService): Tool {
  return {
    name: 'nexus_get_component',
    description: 'Get detailed information about a specific component',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Component ID',
          minLength: 1
        }
      },
      required: ['id'],
      additionalProperties: false
    },
    handler: async (params: any) => {
      try {
        const { id } = validateInput(getComponentSchema, params);
        const component = await componentService.getComponent(id);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(component, null, 2)
            }
          ]
        };
      } catch (error) {
        const mcpError = formatMCPError(error as Error);
        return {
          content: [
            {
              type: 'text',
              text: `Error getting component: ${mcpError.message}`
            }
          ],
          isError: true
        };
      }
    }
  };
}