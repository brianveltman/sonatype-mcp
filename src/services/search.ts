import { NexusClient } from './nexus-client.js';
import { ComponentService, Component, SearchComponentsParams } from './components.js';

/**
 * Search service for advanced search operations
 */
export class SearchService {
  private componentService: ComponentService;

  constructor(private nexusClient: NexusClient) {
    this.componentService = new ComponentService(nexusClient);
  }

  /**
   * Search components with advanced filtering
   */
  async searchComponents(params: SearchComponentsParams): Promise<Component[]> {
    const response = await this.componentService.searchComponents(params);
    return response.items;
  }

  /**
   * Search components by keyword
   */
  async searchByKeyword(keyword: string, repository?: string): Promise<Component[]> {
    const searchParams: SearchComponentsParams = {
      name: keyword,
      ...(repository && { repository })
    };

    const response = await this.componentService.searchComponents(searchParams);
    return response.items;
  }

  /**
   * Search for vulnerabilities in components
   */
  async searchVulnerabilities(repository?: string): Promise<any[]> {
    const queryParams: Record<string, string> = {};
    
    if (repository) {
      queryParams.repository = repository;
    }

    try {
      const vulnerabilities = await this.nexusClient.get<any[]>('/service/rest/v1/vulnerabilities', {
        params: queryParams
      });
      return vulnerabilities;
    } catch (error) {
      // Vulnerability scanning might not be available in all Nexus versions
      console.warn('Vulnerability scanning not available:', error);
      return [];
    }
  }

  /**
   * Search for components by checksum
   */
  async searchByChecksum(checksum: string, format?: string): Promise<Component[]> {
    const queryParams: Record<string, string> = {
      sha1: checksum
    };

    if (format) {
      queryParams.format = format;
    }

    try {
      const components = await this.nexusClient.get<Component[]>('/service/rest/v1/search/assets', {
        params: queryParams
      });
      return components;
    } catch (error) {
      console.warn('Checksum search failed:', error);
      return [];
    }
  }

  /**
   * Get search suggestions
   */
  async getSearchSuggestions(query: string, repository?: string): Promise<string[]> {
    const searchParams: SearchComponentsParams = {
      name: query,
      limit: 10,
      ...(repository && { repository })
    };

    const response = await this.componentService.searchComponents(searchParams);
    return response.items.map(item => item.name);
  }

  /**
   * Search for latest versions of components
   */
  async searchLatestVersions(repository?: string, format?: string): Promise<Component[]> {
    const searchParams: SearchComponentsParams = {
      sort: 'version',
      direction: 'desc',
      limit: 50,
      ...(repository && { repository }),
      ...(format && { format })
    };

    const response = await this.componentService.searchComponents(searchParams);
    
    // Filter to get only the latest version of each component
    const latestVersions = new Map<string, Component>();
    
    for (const component of response.items) {
      const key = `${component.group || ''}:${component.name}`;
      if (!latestVersions.has(key)) {
        latestVersions.set(key, component);
      }
    }

    return Array.from(latestVersions.values());
  }

  /**
   * Search for components modified within a date range
   */
  async searchByDateRange(
    repository?: string
  ): Promise<Component[]> {
    // Note: This is a simplified implementation
    // Actual date range search would require more complex API calls
    const searchParams: SearchComponentsParams = {
      limit: 100,
      ...(repository && { repository })
    };

    const response = await this.componentService.searchComponents(searchParams);
    return response.items;
  }
}