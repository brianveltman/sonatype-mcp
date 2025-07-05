import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { AdminService } from '../../services/admin.js';
import { formatMCPError } from '../../utils/errors.js';

/**
 * Get metrics tool
 */
export function createGetMetricsTool(adminService: AdminService): Tool {
  return {
    name: 'nexus_get_metrics',
    description: 'Retrieve system metrics including memory, threads, and file descriptors',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    },
    handler: async (_params: any) => {
      try {
        const metrics = await adminService.getMetrics();
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(metrics, null, 2)
            }
          ]
        };
      } catch (error) {
        const mcpError = formatMCPError(error as Error);
        return {
          content: [
            {
              type: 'text',
              text: `Error getting metrics: ${mcpError.message}`
            }
          ],
          isError: true
        };
      }
    }
  };
}