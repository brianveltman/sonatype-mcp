import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { NexusClient } from '../services/nexus-client.js';
import { RepositoryService } from '../services/repositories.js';
import { ComponentService } from '../services/components.js';
import { AdminService } from '../services/admin.js';
import { Config } from '../config/environment.js';
import { isToolEnabled } from '../utils/validation.js';

// Repository tools
import { createListRepositoriesTool } from './repository/list-repositories.js';
import { createGetRepositoryTool } from './repository/get-repository.js';
import { createDeleteRepositoryTool } from './repository/delete-repository.js';
import { createCreateRepositoryTool } from './repository/create-repository.js';
import { createUpdateRepositoryTool } from './repository/update-repository.js';

// Component tools
import { createSearchComponentsTool } from './components/search-components.js';
import { createGetComponentTool } from './components/get-component.js';
import { createDeleteComponentTool } from './components/delete-component.js';
import { createGetComponentVersionsTool } from './components/get-component-versions.js';
import { createUploadComponentTool } from './components/upload-component.js';
import { createUploadMultipleAssetsTool } from './components/upload-multiple-assets.js';

// Asset tools
import { createUploadAssetTool } from './assets/upload-asset.js';

// Admin tools
import { createGetSystemStatusTool } from './admin/get-system-status.js';
import { createListBlobStoresTool } from './admin/list-blob-stores.js';
import { createListTasksTool } from './admin/list-tasks.js';
import { createGetUsageMetricsTool } from './admin/get-usage-metrics.js';
import { createGenerateSupportZipTool } from './admin/generate-support-zip.js';

/**
 * Create all available MCP tools
 */
export function createTools(nexusClient: NexusClient, config: Config): Tool[] {
  const repositoryService = new RepositoryService(nexusClient);
  const componentService = new ComponentService(nexusClient);
  const adminService = new AdminService(nexusClient);

  const allTools: Tool[] = [
    // Repository management tools
    createListRepositoriesTool(repositoryService),
    createGetRepositoryTool(repositoryService),
    createDeleteRepositoryTool(repositoryService),
    createCreateRepositoryTool(repositoryService),
    createUpdateRepositoryTool(repositoryService),

    // Component management tools
    createSearchComponentsTool(componentService),
    createGetComponentTool(componentService),
    createDeleteComponentTool(componentService),
    createGetComponentVersionsTool(componentService),
    createUploadComponentTool(componentService),
    createUploadMultipleAssetsTool(componentService),
    
    // Asset management tools
    createUploadAssetTool(componentService),

    // Administrative tools
    createGetSystemStatusTool(adminService),
    createListBlobStoresTool(adminService),
    createListTasksTool(adminService),
    createGetUsageMetricsTool(adminService),
    createGenerateSupportZipTool(adminService)
  ];

  // Filter tools based on enabled tools configuration
  const enabledTools = config.features.enabledTools;
  if (enabledTools.length === 0) {
    return allTools;
  }

  return allTools.filter(tool => isToolEnabled(tool.name, enabledTools));
}

/**
 * Get tool by name
 */
export function getToolByName(tools: Tool[], name: string): Tool | undefined {
  return tools.find(tool => tool.name === name);
}

/**
 * Get available tool names
 */
export function getAvailableToolNames(tools: Tool[]): string[] {
  return tools.map(tool => tool.name);
}