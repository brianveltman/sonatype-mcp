import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { AdminService } from '../../services/admin.js';
import { formatMCPError } from '../../utils/errors.js';

/**
 * Get usage metrics tool
 */
export function createGetUsageMetricsTool(adminService: AdminService): Tool {
  return {
    name: 'nexus_get_usage_metrics',
    description: 'Retrieve Nexus usage metrics including total components and daily request counts. Requires nexus:metrics:read privilege.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    },
    handler: async (_params: any) => {
      try {
        const metricsData = await adminService.getServiceMetricsData();
        
        // Extract key metrics from the response
        const totalComponents = metricsData.gauges?.['nexus.analytics.component_total_count']?.value || 0;
        const dailyRequests = metricsData.gauges?.['nexus.analytics.content_request_count']?.value?.day || 0;
        
        const formattedMetrics = {
          totalComponents,
          dailyRequests,
          rawData: metricsData
        };
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(formattedMetrics, null, 2)
            }
          ]
        };
      } catch (error) {
        const mcpError = formatMCPError(error as Error);
        
        // Provide specific guidance for common errors
        let errorMessage = `Error getting usage metrics: ${mcpError.message}`;
        
        if (mcpError.message.includes('Resource not found') || mcpError.message.includes('404')) {
          errorMessage += '\n\nPossible causes:\n' +
            '• The Service Metrics Data API may not be available in your Nexus version\n' +
            '• The user may lack the required "nexus:metrics:read" privilege\n' +
            '• The API endpoint may be disabled in your Nexus configuration\n\n' +
            'Try using nexus_get_metrics for basic system metrics instead.';
        } else if (mcpError.message.includes('Forbidden') || mcpError.message.includes('403')) {
          errorMessage += '\n\nThe user lacks the required "nexus:metrics:read" privilege.';
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