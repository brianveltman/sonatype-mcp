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
 * System metrics interface
 */
export interface SystemMetrics {
  memory: {
    heap: {
      used: number;
      max: number;
      committed: number;
    };
    nonHeap: {
      used: number;
      max: number;
      committed: number;
    };
  };
  threads: {
    count: number;
    peak: number;
    daemon: number;
  };
  fileDescriptors: {
    open: number;
    max: number;
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
   * Get system metrics
   */
  async getMetrics(): Promise<SystemMetrics> {
    const metrics = await this.nexusClient.get<SystemMetrics>('/service/rest/v1/metrics');
    return metrics;
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
}