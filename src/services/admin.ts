import { NexusClient } from './nexus-client.js';

/**
 * System status interface
 */
export interface SystemStatus {
  healthy: boolean;
  checks: {
    [key: string]: {
      healthy: boolean;
      message?: string;
      error?: string;
      time?: number;
    };
  };
}

/**
 * Blob store information interface
 */
export interface BlobStore {
  name: string;
  type: string;
  available: boolean;
  blobCount: number;
  totalSizeInBytes: number;
  availableSpaceInBytes: number;
  path?: string;
  softQuota?: {
    type: string;
    limit: number;
  };
}


/**
 * Task information interface
 */
export interface Task {
  id: string;
  name: string;
  message: string;
  currentState: string;
  lastRunResult: string;
  nextRun: string;
  lastRun: string;
  runnable: boolean;
  visible: boolean;
  stoppable: boolean;
  typeId: string;
  typeName: string;
}

/**
 * Service metrics data interface
 */
export interface ServiceMetricsData {
  gauges: {
    'nexus.analytics.component_total_count'?: {
      value: number;
    };
    'nexus.analytics.content_request_count'?: {
      value: {
        day: number;
      };
    };
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Administrative service for Nexus system operations
 */
export class AdminService {
  constructor(private nexusClient: NexusClient) {}

  /**
   * Get system status and health checks
   */
  async getSystemStatus(): Promise<SystemStatus> {
    const status = await this.nexusClient.get<SystemStatus>('/service/rest/v1/status/check');
    return status;
  }

  /**
   * Get system information
   */
  async getSystemInfo(): Promise<any> {
    const info = await this.nexusClient.get('/service/rest/v1/status');
    return info;
  }

  /**
   * List blob stores
   */
  async listBlobStores(): Promise<BlobStore[]> {
    const blobStores = await this.nexusClient.get<BlobStore[]>('/service/rest/v1/blobstores');
    return blobStores;
  }

  /**
   * Get blob store details
   */
  async getBlobStore(name: string): Promise<BlobStore> {
    const blobStore = await this.nexusClient.get<BlobStore>(`/service/rest/v1/blobstores/${encodeURIComponent(name)}`);
    return blobStore;
  }


  /**
   * List scheduled tasks
   */
  async listTasks(): Promise<Task[]> {
    const tasks = await this.nexusClient.get<Task[]>('/service/rest/v1/tasks');
    return tasks;
  }

  /**
   * Get task details
   */
  async getTask(id: string): Promise<Task> {
    const task = await this.nexusClient.get<Task>(`/service/rest/v1/tasks/${encodeURIComponent(id)}`);
    return task;
  }

  /**
   * Run a task
   */
  async runTask(id: string): Promise<void> {
    await this.nexusClient.post(`/service/rest/v1/tasks/${encodeURIComponent(id)}/run`);
  }

  /**
   * Stop a task
   */
  async stopTask(id: string): Promise<void> {
    await this.nexusClient.post(`/service/rest/v1/tasks/${encodeURIComponent(id)}/stop`);
  }

  /**
   * Get read-only status
   */
  async getReadOnlyStatus(): Promise<any> {
    const status = await this.nexusClient.get('/service/rest/v1/read-only');
    return status;
  }

  /**
   * Set read-only mode
   */
  async setReadOnly(enabled: boolean): Promise<void> {
    if (enabled) {
      await this.nexusClient.post('/service/rest/v1/read-only/freeze');
    } else {
      await this.nexusClient.post('/service/rest/v1/read-only/release');
    }
  }

  /**
   * Get system configuration
   */
  async getSystemConfiguration(): Promise<any> {
    const config = await this.nexusClient.get('/service/rest/v1/system-configuration');
    return config;
  }

  /**
   * Update system configuration
   */
  async updateSystemConfiguration(config: any): Promise<void> {
    await this.nexusClient.put('/service/rest/v1/system-configuration', config);
  }

  /**
   * Get service metrics data
   * Requires nexus:metrics:read privilege
   */
  async getServiceMetricsData(): Promise<ServiceMetricsData> {
    try {
      // Try the documented endpoint first
      const metricsData = await this.nexusClient.get<ServiceMetricsData>('/service/metrics/data');
      return metricsData;
    } catch (error: any) {
      // If the first endpoint fails with 404, try the alternative REST API path
      if (error.response?.status === 404) {
        try {
          const metricsData = await this.nexusClient.get<ServiceMetricsData>('/service/rest/v1/metrics/data');
          return metricsData;
        } catch (fallbackError) {
          // If both fail, throw the original error
          throw error;
        }
      }
      throw error;
    }
  }
}