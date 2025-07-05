import { NexusClient } from './nexus-client.js';

/**
 * Repository information interface
 */
export interface Repository {
  name: string;
  format: string;
  type: 'hosted' | 'proxy' | 'group';
  url: string;
  attributes: Record<string, any>;
}

/**
 * Repository listing parameters
 */
export interface ListRepositoriesParams {
  format?: string;
  type?: 'hosted' | 'proxy' | 'group';
}

/**
 * Repository service for managing Nexus repositories
 */
export class RepositoryService {
  constructor(private nexusClient: NexusClient) {}

  /**
   * List all repositories
   */
  async listRepositories(params: ListRepositoriesParams = {}): Promise<Repository[]> {
    const queryParams: Record<string, string> = {};
    
    if (params.format) {
      queryParams.format = params.format;
    }
    
    if (params.type) {
      queryParams.type = params.type;
    }

    const repositories = await this.nexusClient.get<Repository[]>('/service/rest/v1/repositories', {
      params: queryParams
    });

    return repositories;
  }

  /**
   * Get repository details by name
   */
  async getRepository(name: string): Promise<Repository> {
    const repository = await this.nexusClient.get<Repository>(`/service/rest/v1/repositories/${encodeURIComponent(name)}`);
    return repository;
  }

  /**
   * Create a new repository
   */
  async createRepository(repositoryConfig: any): Promise<Repository> {
    const repository = await this.nexusClient.post<Repository>('/service/rest/v1/repositories', repositoryConfig);
    return repository;
  }

  /**
   * Update repository configuration
   */
  async updateRepository(name: string, repositoryConfig: any): Promise<Repository> {
    const repository = await this.nexusClient.put<Repository>(
      `/service/rest/v1/repositories/${encodeURIComponent(name)}`,
      repositoryConfig
    );
    return repository;
  }

  /**
   * Delete a repository
   */
  async deleteRepository(name: string): Promise<void> {
    await this.nexusClient.delete(`/service/rest/v1/repositories/${encodeURIComponent(name)}`);
  }

  /**
   * Get repository health check
   */
  async getRepositoryHealth(name: string): Promise<any> {
    const health = await this.nexusClient.get(`/service/rest/v1/repositories/${encodeURIComponent(name)}/health-check`);
    return health;
  }

  /**
   * Get repository status
   */
  async getRepositoryStatus(name: string): Promise<any> {
    const status = await this.nexusClient.get(`/service/rest/v1/repositories/${encodeURIComponent(name)}/status`);
    return status;
  }
}