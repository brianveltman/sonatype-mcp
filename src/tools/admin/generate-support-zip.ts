import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { AdminService, SupportZipConfig } from '../../services/admin.js';
import { validateInput } from '../../utils/validation.js';
import { formatMCPError } from '../../utils/errors.js';
import fs from 'fs/promises';
import path from 'path';

const supportZipSchema = z.object({
  outputPath: z.string().optional().describe('Path where to save the support zip file (optional)'),
  filename: z.string().optional().describe('Custom filename for the support zip (optional, defaults to supportzip-{timestamp}.zip)'),
  systemInformation: z.boolean().optional().default(true).describe('Include system information'),
  threadDump: z.boolean().optional().default(true).describe('Include thread dump'),
  metrics: z.boolean().optional().default(true).describe('Include metrics'),
  configuration: z.boolean().optional().default(true).describe('Include configuration (may contain sensitive data)'),
  security: z.boolean().optional().default(false).describe('Include security information (contains sensitive data)'),
  logFiles: z.boolean().optional().default(true).describe('Include log files'),
  taskLogFiles: z.boolean().optional().default(false).describe('Include task log files'),
  auditLogFiles: z.boolean().optional().default(false).describe('Include audit log files'),
  jmx: z.boolean().optional().default(false).describe('Include JMX information')
});

type SupportZipParams = z.infer<typeof supportZipSchema>;

/**
 * Generate support zip tool
 */
export function createGenerateSupportZipTool(adminService: AdminService): Tool {
  return {
    name: 'nexus_generate_support_zip',
    description: 'Generate and optionally save a support zip file containing diagnostic information for troubleshooting. The zip includes system info, logs, metrics, and configuration data.',
    inputSchema: {
      type: 'object',
      properties: {
        outputPath: {
          type: 'string',
          description: 'Directory path where to save the support zip file (optional)'
        },
        filename: {
          type: 'string',
          description: 'Custom filename for the support zip (optional, defaults to supportzip-{timestamp}.zip)'
        },
        systemInformation: {
          type: 'boolean',
          description: 'Include system information',
          default: true
        },
        threadDump: {
          type: 'boolean',
          description: 'Include thread dump',
          default: true
        },
        metrics: {
          type: 'boolean',
          description: 'Include metrics',
          default: true
        },
        configuration: {
          type: 'boolean',
          description: 'Include configuration (may contain sensitive data)',
          default: true
        },
        security: {
          type: 'boolean',
          description: 'Include security information (contains sensitive data)',
          default: false
        },
        logFiles: {
          type: 'boolean',
          description: 'Include log files',
          default: true
        },
        taskLogFiles: {
          type: 'boolean',
          description: 'Include task log files',
          default: false
        },
        auditLogFiles: {
          type: 'boolean',
          description: 'Include audit log files',
          default: false
        },
        jmx: {
          type: 'boolean',
          description: 'Include JMX information',
          default: false
        }
      },
      additionalProperties: false
    },
    handler: async (params: SupportZipParams) => {
      try {
        const validatedParams = validateInput(supportZipSchema, params);
        
        // Build configuration object
        const config: SupportZipConfig = {
          systemInformation: validatedParams.systemInformation,
          threadDump: validatedParams.threadDump,
          metrics: validatedParams.metrics,
          configuration: validatedParams.configuration,
          security: validatedParams.security,
          logFiles: validatedParams.logFiles,
          taskLogFiles: validatedParams.taskLogFiles,
          auditLogFiles: validatedParams.auditLogFiles,
          jmx: validatedParams.jmx
        };

        // Generate the support zip
        const zipBuffer = await adminService.generateSupportZip(config);
        
        let savedPath: string | null = null;
        
        // Save to file if outputPath is provided
        if (validatedParams.outputPath) {
          // Generate filename if not provided
          const filename = validatedParams.filename || `supportzip-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
          const fullPath = path.join(validatedParams.outputPath, filename);
          
          // Ensure directory exists
          await fs.mkdir(validatedParams.outputPath, { recursive: true });
          
          // Write the zip file
          await fs.writeFile(fullPath, zipBuffer);
          savedPath = fullPath;
        }

        const result = {
          success: true,
          size: zipBuffer.length,
          sizeFormatted: `${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB`,
          savedPath,
          configuration: config,
          timestamp: new Date().toISOString(),
          message: savedPath 
            ? `Support zip generated and saved to ${savedPath}`
            : `Support zip generated successfully (${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB)`
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
        let errorMessage = `Error generating support zip: ${mcpError.message}`;
        
        if (mcpError.message.includes('Forbidden') || mcpError.message.includes('403')) {
          errorMessage += '\n\nThe user may lack administrative privileges required to generate support zip files.';
        } else if (mcpError.message.includes('ENOENT') || mcpError.message.includes('EACCES')) {
          errorMessage += '\n\nCheck that the output path exists and is writable.';
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