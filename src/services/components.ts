import { NexusClient } from './nexus-client.js';

/**
 * Component information interface
 */
export interface Component {
  id: string;
  repository: string;
  format: string;
  group?: string;
  name: string;
  version: string;
  assets: Asset[];
}

/**
 * Asset information interface
 */
export interface Asset {
  id: string;
  path: string;
  downloadUrl: string;
  format: string;
  checksum: {
    sha1: string;
    sha256?: string;
    md5?: string;
  };
  contentType: string;
  lastModified: string;
  blobCreated: string;
  lastDownloaded?: string;
}

/**
 * Component search parameters
 */
export interface SearchComponentsParams {
  repository?: string;
  format?: string;
  group?: string;
  name?: string;
  version?: string;
  prerelease?: boolean;
  sort?: 'name' | 'version' | 'format';
  direction?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Component search response
 */
export interface ComponentSearchResponse {
  items: Component[];
  continuationToken?: string;
}

/**
 * Component service for managing Nexus components
 */
export class ComponentService {
  constructor(public readonly nexusClient: NexusClient) {}

  /**
   * Search components
   */
  async searchComponents(params: SearchComponentsParams = {}): Promise<ComponentSearchResponse> {
    const queryParams: Record<string, string> = {};
    
    if (params.repository) queryParams.repository = params.repository;
    if (params.format) queryParams.format = params.format;
    if (params.group) queryParams.group = params.group;
    if (params.name) queryParams.name = params.name;
    if (params.version) queryParams.version = params.version;
    if (params.prerelease !== undefined) queryParams.prerelease = params.prerelease.toString();
    if (params.sort) queryParams.sort = params.sort;
    if (params.direction) queryParams.direction = params.direction;
    
    // Use continuation token for pagination instead of offset
    const response = await this.nexusClient.get<ComponentSearchResponse>('/service/rest/v1/search', {
      params: queryParams
    });

    return response;
  }

  /**
   * Get component by ID
   */
  async getComponent(id: string): Promise<Component> {
    const component = await this.nexusClient.get<Component>(`/service/rest/v1/components/${encodeURIComponent(id)}`);
    return component;
  }

  /**
   * Upload component to repository
   */
  async uploadComponent(repository: string, formData: any): Promise<Component> {
    const component = await this.nexusClient.post<Component>(
      `/service/rest/v1/components?repository=${encodeURIComponent(repository)}`,
      formData,
      {
        headers: formData.getHeaders ? formData.getHeaders() : {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return component;
  }

  /**
   * Delete component by ID
   */
  async deleteComponent(id: string): Promise<void> {
    await this.nexusClient.delete(`/service/rest/v1/components/${encodeURIComponent(id)}`);
  }

  /**
   * Get component versions
   */
  async getComponentVersions(repository: string, format: string, group: string, name: string): Promise<string[]> {
    const searchParams = {
      repository,
      format,
      group,
      name,
      sort: 'version' as const,
      direction: 'desc' as const
    };

    const response = await this.searchComponents(searchParams);
    return response.items.map(component => component.version);
  }

  /**
   * Get assets for a component
   */
  async getAssets(componentId: string): Promise<Asset[]> {
    const component = await this.getComponent(componentId);
    return component.assets;
  }

  /**
   * Get asset by ID
   */
  async getAsset(id: string): Promise<Asset> {
    const asset = await this.nexusClient.get<Asset>(`/service/rest/v1/assets/${encodeURIComponent(id)}`);
    return asset;
  }

  /**
   * Delete asset by ID
   */
  async deleteAsset(id: string): Promise<void> {
    await this.nexusClient.delete(`/service/rest/v1/assets/${encodeURIComponent(id)}`);
  }
}