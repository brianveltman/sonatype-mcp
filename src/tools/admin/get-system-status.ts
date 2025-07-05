import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { AdminService } from '../../services/admin.js';
import { validateInput, getSystemStatusSchema } from '../../utils/validation.js';
import { formatMCPError } from '../../utils/errors.js';

/**
 * Get system status tool
 */
export function createGetSystemStatusTool(adminService: AdminService): Tool {
  return {
    name: 'nexus_get_system_status',
    description: 'Get system health status and checks',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    },
    handler: async (params: any) => {
      try {
        validateInput(getSystemStatusSchema, params);
        const status = await adminService.getSystemStatus();
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(status, null, 2)
            }
          ]
        };
      } catch (error) {
        const mcpError = formatMCPError(error as Error);
        return {
          content: [
            {
              type: 'text',
              text: `Error getting system status: ${mcpError.message}`
            }
          ],
          isError: true
        };
      }
    }
  };
}