import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import FormData from 'form-data';
import fs from 'fs/promises';
import path from 'path';
import { ComponentService } from '../../services/components.js';
import { validateInput } from '../../utils/validation.js';
import { formatMCPError } from '../../utils/errors.js';

const assetSchema = z.object({
  file: z.string().describe('Path to the file to upload'),
  filename: z.string().optional().describe('Filename to use in the repository'),
  classifier: z.string().optional().describe('Classifier for Maven assets'),
  extension: z.string().optional().describe('Extension for Maven assets')
});

const uploadMultipleAssetsSchema = z.object({
  repository: z.string().describe('The repository to upload to'),
  format: z.enum(['maven2', 'raw']).describe('Repository format (only maven2 and raw support multiple assets)'),
  assets: z.array(assetSchema).min(1).describe('Array of assets to upload'),
  // Maven specific
  groupId: z.string().optional().describe('Maven group ID - required for maven2'),
  artifactId: z.string().optional().describe('Maven artifact ID - required for maven2'),
  version: z.string().optional().describe('Component version - required for maven2'),
  packaging: z.string().optional().describe('Packaging type'),
  generatePom: z.boolean().optional().describe('Generate POM file'),
  // Raw specific
  directory: z.string().optional().describe('Directory path - required for raw')
});

type UploadMultipleAssetsParams = z.infer<typeof uploadMultipleAssetsSchema>;

export function createUploadMultipleAssetsTool(componentService: ComponentService): Tool {
  return {
    name: 'nexus_upload_multiple_assets',
    description: 'Upload multiple assets to a Maven or Raw repository',
    inputSchema: {
      type: 'object',
      properties: {
        repository: { type: 'string', description: 'The repository to upload to' },
        format: { 
          type: 'string', 
          enum: ['maven2', 'raw'],
          description: 'Repository format (only maven2 and raw support multiple assets)' 
        },
        assets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string', description: 'Path to the file' },
              filename: { type: 'string', description: 'Filename in repository' },
              classifier: { type: 'string', description: 'Maven classifier' },
              extension: { type: 'string', description: 'Maven extension' }
            },
            required: ['file']
          },
          description: 'Array of assets to upload'
        },
        groupId: { type: 'string', description: 'Maven group ID - required for maven2' },
        artifactId: { type: 'string', description: 'Maven artifact ID - required for maven2' },
        version: { type: 'string', description: 'Component version - required for maven2' },
        packaging: { type: 'string', description: 'Packaging type' },
        generatePom: { type: 'boolean', description: 'Generate POM file' },
        directory: { type: 'string', description: 'Directory path - required for raw' }
      },
      required: ['repository', 'format', 'assets']
    },
    handler: async (params: any) => {
      try {
        const validParams = validateInput(uploadMultipleAssetsSchema, params) as UploadMultipleAssetsParams;
        
        // Validate format-specific requirements
        if (validParams.format === 'maven2' && (!validParams.groupId || !validParams.artifactId || !validParams.version)) {
          throw new Error('Maven uploads require groupId, artifactId, and version');
        }
        if (validParams.format === 'raw' && !validParams.directory) {
          throw new Error('Raw uploads require directory parameter');
        }

        // Check if all files exist
        for (const asset of validParams.assets) {
          try {
            await fs.access(asset.file);
          } catch {
            throw new Error(`File not found: ${asset.file}`);
          }
        }

        // Create form data
        const form = new FormData();

        if (validParams.format === 'maven2') {
          form.append('maven2.groupId', validParams.groupId!);
          form.append('maven2.artifactId', validParams.artifactId!);
          form.append('maven2.version', validParams.version!);
          if (validParams.packaging) form.append('maven2.packaging', validParams.packaging);
          if (validParams.generatePom !== undefined) form.append('maven2.generate-pom', validParams.generatePom.toString());

          // Add each asset
          for (let i = 0; i < validParams.assets.length; i++) {
            const asset = validParams.assets[i];
            const assetNum = i + 1;
            const fileBuffer = await fs.readFile(asset.file);
            const fileName = path.basename(asset.file);
            
            form.append(`maven2.asset${assetNum}`, fileBuffer, fileName);
            form.append(`maven2.asset${assetNum}.extension`, asset.extension || path.extname(fileName).slice(1) || 'jar');
            if (asset.classifier) form.append(`maven2.asset${assetNum}.classifier`, asset.classifier);
          }
        } else if (validParams.format === 'raw') {
          form.append('raw.directory', validParams.directory!);
          
          // Add each asset
          for (let i = 0; i < validParams.assets.length; i++) {
            const asset = validParams.assets[i];
            const assetNum = i + 1;
            const fileBuffer = await fs.readFile(asset.file);
            const fileName = asset.filename || path.basename(asset.file);
            
            form.append(`raw.asset${assetNum}`, fileBuffer, fileName);
            form.append(`raw.asset${assetNum}.filename`, fileName);
          }
        }

        const result = await componentService.uploadComponent(validParams.repository, form);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              component: result,
              message: `Successfully uploaded ${validParams.assets.length} assets to ${validParams.repository}`
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