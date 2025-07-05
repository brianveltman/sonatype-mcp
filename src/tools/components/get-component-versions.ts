import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ComponentService } from '../../services/components.js';
import { formatMCPError } from '../../utils/errors.js';
import { z } from 'zod';
import { validateInput } from '../../utils/validation.js';

const getComponentVersionsSchema = z.object({
  repository: z.string().min(1, 'Repository name is required'),
  format: z.enum(['npm', 'maven2', 'nuget', 'pypi', 'docker', 'raw', 'yum', 'apt']),
  group: z.string().min(1, 'Group is required'),
  name: z.string().min(1, 'Component name is required')
}).strict();

/**
 * Get component versions tool
 */
export function createGetComponentVersionsTool(componentService: ComponentService): Tool {
  return {
    name: 'nexus_get_component_versions',
    description: 'Get all versions of a specific component',
    inputSchema: {
      type: 'object',
      properties: {
        repository: {
          type: 'string',
          description: 'Repository name',
          minLength: 1
        },
        format: {
          type: 'string',
          description: 'Component format',
          enum: ['npm', 'maven2', 'nuget', 'pypi', 'docker', 'raw', 'yum', 'apt']
        },
        group: {
          type: 'string',
          description: 'Component group/namespace',
          minLength: 1
        },
        name: {
          type: 'string',
          description: 'Component name',
          minLength: 1
        }
      },
      required: ['repository', 'format', 'group', 'name'],
      additionalProperties: false
    },
    handler: async (params: any) => {
      try {
        const { repository, format, group, name } = validateInput(getComponentVersionsSchema, params);
        const versions = await componentService.getComponentVersions(repository, format, group, name);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                repository,
                format,
                group,
                name,
                versions,
                count: versions.length
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
              text: `Error getting component versions: ${mcpError.message}`
            }
          ],
          isError: true
        };
      }
    }
  };
}