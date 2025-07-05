import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { AdminService } from '../../services/admin.js';
import { validateInput, listBlobStoresSchema } from '../../utils/validation.js';
import { formatMCPError } from '../../utils/errors.js';

/**
 * List blob stores tool
 */
export function createListBlobStoresTool(adminService: AdminService): Tool {
  return {
    name: 'nexus_list_blob_stores',
    description: 'List all blob store configurations',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    },
    handler: async (params: any) => {
      try {
        validateInput(listBlobStoresSchema, params);
        const blobStores = await adminService.listBlobStores();
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                blobStores,
                count: blobStores.length
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
              text: `Error listing blob stores: ${mcpError.message}`
            }
          ],
          isError: true
        };
      }
    }
  };
}