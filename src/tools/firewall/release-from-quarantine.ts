import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { QuarantineService } from '../../services/quarantine.js';
import { validateInput } from '../../utils/validation.js';
import { formatMCPError } from '../../utils/errors.js';

const releaseFromQuarantineSchema = z.object({
  quarantineId: z.string().min(1).describe('The quarantine ID of the component to release'),
  comment: z.string().optional().describe('Optional comment explaining the reason for release')
});

type ReleaseFromQuarantineParams = z.infer<typeof releaseFromQuarantineSchema>;

/**
 * Release from quarantine tool for Firewall
 */
export function createReleaseFromQuarantineTool(quarantineService: QuarantineService): Tool {
  return {
    name: 'firewall_release_from_quarantine',
    description: 'Release a component from quarantine by waiving policy violations in Sonatype Firewall. This allows the component to be used despite failing firewall policies. Write mode only. Requires Firewall credentials.',
    inputSchema: {
      type: 'object',
      properties: {
        quarantineId: {
          type: 'string',
          description: 'The quarantine ID of the component to release (required)'
        },
        comment: {
          type: 'string',
          description: 'Optional comment explaining the reason for releasing the component'
        }
      },
      required: ['quarantineId'],
      additionalProperties: false
    },
    handler: async (params: ReleaseFromQuarantineParams) => {
      try {
        const validatedParams = validateInput(releaseFromQuarantineSchema, params);
        
        const releaseRequest = validatedParams.comment 
          ? { comment: validatedParams.comment }
          : {};
        
        const releaseResponse = await quarantineService.releaseFromQuarantine(
          validatedParams.quarantineId,
          releaseRequest
        );
        
        const result = {
          success: true,
          quarantineId: validatedParams.quarantineId,
          releaseDate: releaseResponse.releaseDate || new Date().toISOString(),
          component: releaseResponse.component,
          waivedPolicyViolations: releaseResponse.waivedPolicyViolations,
          comment: validatedParams.comment,
          message: `Component successfully released from Firewall quarantine. ${
            releaseResponse.waivedPolicyViolations?.length || 0
          } policy violation(s) were waived.`
        };
        
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
        let errorMessage = `Error releasing component from Firewall quarantine: ${mcpError.message}`;
        
        if (mcpError.message.includes('Forbidden') || mcpError.message.includes('403')) {
          errorMessage += '\n\nThe user may lack the required privileges to release components from Firewall quarantine. ' +
            'Ensure the user has permissions to manage firewall quarantine and waive policy violations.';
        } else if (mcpError.message.includes('Not Found') || mcpError.message.includes('404')) {
          errorMessage += '\n\nThe quarantine ID may not exist or may have already been released. ' +
            'Verify the quarantine ID is correct and the component is still in quarantine.';
        } else if (mcpError.message.includes('Bad Request') || mcpError.message.includes('400')) {
          errorMessage += '\n\nThe request may be invalid. Check that the quarantine ID is properly formatted.';
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