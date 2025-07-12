import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import FormData from 'form-data';
import fs from 'fs/promises';
import path from 'path';
import { ComponentService } from '../../services/components.js';
import { validateInput } from '../../utils/validation.js';
import { formatMCPError } from '../../utils/errors.js';

const uploadComponentSchema = z.object({
  repository: z.string().describe('The repository to upload to'),
  format: z.enum(['maven2', 'npm', 'pypi', 'docker', 'raw', 'helm', 'nuget', 'rubygems']).describe('Repository format'),
  file: z.string().describe('Path to the file to upload'),
  // Maven specific
  groupId: z.string().optional().describe('Maven group ID (e.g., com.example) - required for maven2'),
  artifactId: z.string().optional().describe('Maven artifact ID - required for maven2'),
  version: z.string().optional().describe('Component version - required for maven2'),
  packaging: z.string().optional().describe('Packaging type (e.g., jar, war, pom)'),
  generatePom: z.boolean().optional().describe('Whether to generate a POM file'),
  classifier: z.string().optional().describe('Classifier for the artifact'),
  // Raw specific
  directory: z.string().optional().describe('Directory path in the repository - required for raw'),
  filename: z.string().optional().describe('Filename to use in the repository')
});

type UploadComponentParams = z.infer<typeof uploadComponentSchema>;

export function createUploadComponentTool(componentService: ComponentService): Tool {
  return {
    name: 'nexus_upload_component',
    description: 'Upload a component to a Nexus repository',
    inputSchema: {
      type: 'object',
      properties: {
        repository: { type: 'string', description: 'The repository to upload to' },
        format: { 
          type: 'string', 
          enum: ['maven2', 'npm', 'pypi', 'docker', 'raw', 'helm', 'nuget', 'rubygems'],
          description: 'Repository format' 
        },
        file: { type: 'string', description: 'Path to the file to upload' },
        groupId: { type: 'string', description: 'Maven group ID - required for maven2' },
        artifactId: { type: 'string', description: 'Maven artifact ID - required for maven2' },
        version: { type: 'string', description: 'Component version - required for maven2' },
        packaging: { type: 'string', description: 'Packaging type (jar, war, pom)' },
        generatePom: { type: 'boolean', description: 'Generate POM file' },
        classifier: { type: 'string', description: 'Classifier (sources, javadoc)' },
        directory: { type: 'string', description: 'Directory path - required for raw' },
        filename: { type: 'string', description: 'Filename in repository' }
      },
      required: ['repository', 'format', 'file']
    },
    handler: async (params: any) => {
      try {
        const validParams = validateInput(uploadComponentSchema, params) as UploadComponentParams;
        
        // Validate format-specific requirements
        if (validParams.format === 'maven2' && (!validParams.groupId || !validParams.artifactId || !validParams.version)) {
          throw new Error('Maven uploads require groupId, artifactId, and version');
        }
        if (validParams.format === 'raw' && !validParams.directory) {
          throw new Error('Raw uploads require directory parameter');
        }

        // Check if file exists
        try {
          await fs.access(validParams.file);
        } catch {
          throw new Error(`File not found: ${validParams.file}`);
        }

        // Create form data
        const form = new FormData();
        const fileBuffer = await fs.readFile(validParams.file);
        const fileName = path.basename(validParams.file);

        // Handle format-specific fields
        switch (validParams.format) {
          case 'maven2':
            form.append('maven2.groupId', validParams.groupId!);
            form.append('maven2.artifactId', validParams.artifactId!);
            form.append('maven2.version', validParams.version!);
            if (validParams.packaging) form.append('maven2.packaging', validParams.packaging);
            if (validParams.generatePom !== undefined) form.append('maven2.generate-pom', validParams.generatePom.toString());
            
            form.append('maven2.asset1', fileBuffer, fileName);
            form.append('maven2.asset1.extension', path.extname(fileName).slice(1) || 'jar');
            if (validParams.classifier) form.append('maven2.asset1.classifier', validParams.classifier);
            break;

          case 'raw':
            form.append('raw.directory', validParams.directory!);
            form.append('raw.asset1', fileBuffer, fileName);
            form.append('raw.asset1.filename', validParams.filename || fileName);
            break;

          case 'npm':
            form.append('npm.asset', fileBuffer, fileName);
            break;

          case 'pypi':
            form.append('pypi.asset', fileBuffer, fileName);
            break;

          case 'docker':
            form.append('docker.asset', fileBuffer, fileName);
            break;

          case 'helm':
            form.append('helm.asset', fileBuffer, fileName);
            break;

          case 'nuget':
            form.append('nuget.asset', fileBuffer, fileName);
            break;

          case 'rubygems':
            form.append('rubygems.asset', fileBuffer, fileName);
            break;
        }

        const result = await componentService.uploadComponent(validParams.repository, form);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              component: result,
              message: `Successfully uploaded component to ${validParams.repository}`
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