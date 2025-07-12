import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { QuarantineService } from '../../services/quarantine.js';
import { validateInput } from '../../utils/validation.js';
import { formatMCPError } from '../../utils/errors.js';

const getQuarantinedComponentsSchema = z.object({
  repository: z.string().optional().describe('Filter by specific repository name'),
  packageUrl: z.string().optional().describe('Filter by specific package URL (PURL)'),
  searchPattern: z.string().optional().describe('Search pattern to match against package URLs or display names')
});

type GetQuarantinedComponentsParams = z.infer<typeof getQuarantinedComponentsSchema>;

/**
 * Get quarantined components tool for Firewall
 */
export function createGetQuarantinedComponentsTool(quarantineService: QuarantineService): Tool {
  return {
    name: 'firewall_get_quarantined_components',
    description: 'Retrieve components that have been quarantined by Sonatype Firewall policies. Can filter by repository, package URL, or search pattern. Requires Firewall credentials.',
    inputSchema: {
      type: 'object',
      properties: {
        repository: {
          type: 'string',
          description: 'Filter quarantined components by specific repository name'
        },
        packageUrl: {
          type: 'string',
          description: 'Filter by specific package URL (PURL)'
        },
        searchPattern: {
          type: 'string',
          description: 'Search pattern to match against package URLs or display names'
        }
      },
      additionalProperties: false
    },
    handler: async (params: GetQuarantinedComponentsParams) => {
      try {
        const validatedParams = validateInput(getQuarantinedComponentsSchema, params);
        
        let result: any;
        
        if (validatedParams.repository) {
          // Get quarantined components for specific repository
          const repoSummary = await quarantineService.getQuarantinedComponentsByRepository(validatedParams.repository);
          if (!repoSummary) {
            result = {
              repository: validatedParams.repository,
              componentsInQuarantine: 0,
              components: [],
              message: `No quarantined components found in repository '${validatedParams.repository}'`
            };
          } else {
            result = {
              ...repoSummary,
              message: `Found ${repoSummary.componentsInQuarantine || 0} quarantined component(s) in repository '${validatedParams.repository}'`
            };
          }
        } else if (validatedParams.searchPattern) {
          // Search quarantined components by pattern
          const matchingComponents = await quarantineService.searchQuarantinedComponents(validatedParams.searchPattern);
          result = {
            searchPattern: validatedParams.searchPattern,
            matchingComponents,
            totalMatches: matchingComponents.length,
            message: `Found ${matchingComponents.length} quarantined component(s) matching pattern '${validatedParams.searchPattern}'`
          };
        } else {
          // Get all quarantined components (optionally filtered by PURL)
          const quarantineResponse = await quarantineService.getQuarantinedComponents(validatedParams.packageUrl);
          
          // Calculate totals
          let totalQuarantined = 0;
          let totalRepositories = 0;
          
          if (quarantineResponse.repositoryQuarantineSummary) {
            totalRepositories = quarantineResponse.repositoryQuarantineSummary.length;
            totalQuarantined = quarantineResponse.repositoryQuarantineSummary.reduce(
              (sum, repo) => sum + (repo.componentsInQuarantine || 0), 
              0
            );
          }
          
          result = {
            ...quarantineResponse,
            summary: {
              totalQuarantinedComponents: totalQuarantined,
              totalRepositoriesWithQuarantine: totalRepositories,
              packageUrlFilter: validatedParams.packageUrl
            },
            message: validatedParams.packageUrl 
              ? `Found quarantined components matching PURL '${validatedParams.packageUrl}'`
              : `Found ${totalQuarantined} quarantined component(s) across ${totalRepositories} repository/repositories`
          };
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        const mcpError = formatMCPError(error as Error);
        
        // Provide specific guidance for common errors
        let errorMessage = `Error retrieving quarantined components from Firewall: ${mcpError.message}`;
        
        if (mcpError.message.includes('Forbidden') || mcpError.message.includes('403')) {
          errorMessage += '\n\nThe user may lack the required privileges to access Firewall quarantine information. ' +
            'Ensure the user has permissions to view firewall quarantine data.';
        } else if (mcpError.message.includes('Not Found') || mcpError.message.includes('404')) {
          errorMessage += '\n\nThe Firewall quarantine API may not be available. This could indicate:' +
            '\n• Sonatype Firewall is not running or configured' +
            '\n• The API endpoint is not available in your Firewall version' +
            '\n• The Firewall URL is incorrect';
        } else if (mcpError.message.includes('Firewall credentials not configured')) {
          errorMessage += '\n\nFirewall credentials are required. Please provide --firewall-username and --firewall-password arguments.';
        } else if (mcpError.message.includes('ECONNREFUSED') || mcpError.message.includes('ENOTFOUND')) {
          errorMessage += '\n\nCannot connect to Firewall. Check that:' +
            '\n• Firewall is running and accessible' +
            '\n• The --firewall-url is correct' +
            '\n• Network connectivity allows access to Firewall';
        }
        
        return {
          content: [
            {
              type: 'text',
              text: errorMessage
            }
          ],
          isError: true
        };
      }
    }
  };
}