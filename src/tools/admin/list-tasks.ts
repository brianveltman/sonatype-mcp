import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { AdminService } from '../../services/admin.js';
import { formatMCPError } from '../../utils/errors.js';

/**
 * List tasks tool
 */
export function createListTasksTool(adminService: AdminService): Tool {
  return {
    name: 'nexus_list_tasks',
    description: 'List all scheduled tasks',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    },
    handler: async (_params: any) => {
      try {
        const tasks = await adminService.listTasks();
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                tasks,
                count: tasks.length
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
              text: `Error listing tasks: ${mcpError.message}`
            }
          ],
          isError: true
        };
      }
    }
  };
}