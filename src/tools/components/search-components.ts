import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ComponentService } from '../../services/components.js';
import { validateInput, searchComponentsSchema } from '../../utils/validation.js';
import { formatMCPError } from '../../utils/errors.js';

/**
 * Search components tool
 */
export function createSearchComponentsTool(componentService: ComponentService): Tool {
  return {
    name: 'nexus_search_components',
    description: 'Search for components across repositories',
    inputSchema: {
      type: 'object',
      properties: {
        repository: {
          type: 'string',
          description: 'Repository name to search in'
        },
        format: {
          type: 'string',
          description: 'Component format',
          enum: ['npm', 'maven2', 'nuget', 'pypi', 'docker', 'raw', 'yum', 'apt']
        },
        group: {
          type: 'string',
          description: 'Component group/namespace'
        },
        name: {
          type: 'string',
          description: 'Component name'
        },
        version: {
          type: 'string',
          description: 'Component version'
        },
        prerelease: {
          type: 'boolean',
          description: 'Include prerelease versions'
        },
        sort: {
          type: 'string',
          description: 'Sort field',
          enum: ['name', 'version', 'format']
        },
        direction: {
          type: 'string',
          description: 'Sort direction',
          enum: ['asc', 'desc']
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results',
          minimum: 1,
          maximum: 1000,
          default: 25
        },
        offset: {
          type: 'number',
          description: 'Offset for pagination',
          minimum: 0,
          default: 0
        }
      },
      additionalProperties: false
    },
    handler: async (params: any) => {
      try {
        const validParams = validateInput(searchComponentsSchema, params);
        const response = await componentService.searchComponents(validParams);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                components: response.items,
                count: response.items.length,
                continuationToken: response.continuationToken
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
              text: `Error searching components: ${mcpError.message}`
            }
          ],
          isError: true
        };
      }
    }
  };
}