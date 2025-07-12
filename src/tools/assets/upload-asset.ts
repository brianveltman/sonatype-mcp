import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import FormData from 'form-data';
import fs from 'fs/promises';
import path from 'path';
import { ComponentService } from '../../services/components.js';
import { validateInput } from '../../utils/validation.js';
import { formatMCPError } from '../../utils/errors.js';

const uploadAssetSchema = z.object({
  repository: z.string().describe('The repository to upload to'),
  directory: z.string().describe('Directory path in the repository'),
  file: z.string().describe('Path to the file to upload'),
  filename: z.string().optional().describe('Filename to use in the repository (defaults to original filename)')
});

type UploadAssetParams = z.infer<typeof uploadAssetSchema>;

export function createUploadAssetTool(componentService: ComponentService): Tool {
  return {
    name: 'nexus_upload_asset',
    description: 'Upload an asset directly to a raw repository',
    inputSchema: {
      type: 'object',
      properties: {
        repository: {
          type: 'string',
          description: 'The repository to upload to'
        },
        directory: {
          type: 'string',
          description: 'Directory path in the repository'
        },
        file: {
          type: 'string',
          description: 'Path to the file to upload'
        },
        filename: {
          type: 'string',
          description: 'Filename to use in the repository (defaults to original filename)'
        }
      },
      required: ['repository', 'directory', 'file']
    },
    handler: async (params: any) => {
      try {
        const validParams = validateInput(uploadAssetSchema, params) as UploadAssetParams;
        
        // Check if file exists
        try {
          await fs.access(validParams.file);
        } catch {
          throw new Error(`File not found: ${validParams.file}`);
        }

        // Create form data
        const form = new FormData();
        const fileBuffer = await fs.readFile(validParams.file);
        const fileName = validParams.filename || path.basename(validParams.file);

        // Add raw format fields
        form.append('raw.directory', validParams.directory);
        form.append('raw.asset1', fileBuffer, fileName);
        form.append('raw.asset1.filename', fileName);

        const result = await componentService.uploadComponent(validParams.repository, form);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              asset: result,
              message: `Successfully uploaded asset to ${validParams.repository}/${validParams.directory}/${fileName}`
            }, null, 2)
          }]
        };
      } catch (error) {
        const mcpError = formatMCPError(error as Error);
        return {
          content: [{
            type: 'text',
            text: `Error: ${mcpError.message}`
          }],
          isError: true
        };
      }
    }
  };
}