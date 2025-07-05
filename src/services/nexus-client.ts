import axios, { AxiosInstance } from 'axios';
import { Config } from '../config/environment.js';
import { createAuthHeaders, validateCredentials } from '../utils/auth.js';
import { handleNexusError, AuthenticationError, ConfigurationError } from '../utils/errors.js';

/**
 * Request options interface
 */
export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  params?: Record<string, any>;
}

/**
 * Nexus Repository Manager REST API client
 */
export class NexusClient {
  private readonly client: AxiosInstance;
  private readonly config: Config;

  constructor(config: Config) {
    this.config = config;
    
    // Validate configuration
    if (!validateCredentials(config)) {
      throw new ConfigurationError('Invalid Nexus credentials: username and password are required');
    }

    // Create axios instance with default configuration
    this.client = axios.create({
      baseURL: config.nexus.baseUrl,
      timeout: config.nexus.timeout,
      headers: createAuthHeaders(config),
      validateStatus: () => true, // We'll handle all status codes manually
      ...(config.nexus.validateSsl === false && {
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false
        })
      })
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.error(`Making request to: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.error(`Response: ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        console.error('Response interceptor error:', error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Test the connection to Nexus
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/service/rest/v1/status/check');
      return response.status === 200;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Make a GET request to Nexus API
   */
  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    try {
      const response = await this.client.get<T>(endpoint, {
        ...options,
        headers: {
          ...createAuthHeaders(this.config),
          ...options.headers
        }
      });

      if (response.status >= 400) {
        throw { response };
      }

      return response.data;
    } catch (error) {
      handleNexusError(error);
    }
  }

  /**
   * Make a POST request to Nexus API
   */
  async post<T>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<T> {
    if (this.config.server.readOnly) {
      throw new AuthenticationError('Write operations are disabled in read-only mode');
    }

    try {
      const response = await this.client.post<T>(endpoint, data, {
        ...options,
        headers: {
          ...createAuthHeaders(this.config),
          ...options.headers
        }
      });

      if (response.status >= 400) {
        throw { response };
      }

      return response.data;
    } catch (error) {
      handleNexusError(error);
    }
  }

  /**
   * Make a PUT request to Nexus API
   */
  async put<T>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<T> {
    if (this.config.server.readOnly) {
      throw new AuthenticationError('Write operations are disabled in read-only mode');
    }

    try {
      const response = await this.client.put<T>(endpoint, data, {
        ...options,
        headers: {
          ...createAuthHeaders(this.config),
          ...options.headers
        }
      });

      if (response.status >= 400) {
        throw { response };
      }

      return response.data;
    } catch (error) {
      handleNexusError(error);
    }
  }

  /**
   * Make a DELETE request to Nexus API
   */
  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    if (this.config.server.readOnly) {
      throw new AuthenticationError('Write operations are disabled in read-only mode');
    }

    try {
      const response = await this.client.delete<T>(endpoint, {
        ...options,
        headers: {
          ...createAuthHeaders(this.config),
          ...options.headers
        }
      });

      if (response.status >= 400) {
        throw { response };
      }

      return response.data;
    } catch (error) {
      handleNexusError(error);
    }
  }

  /**
   * Get server information
   */
  async getServerInfo(): Promise<any> {
    return this.get('/service/rest/v1/status');
  }

  /**
   * Get read-only mode status
   */
  isReadOnly(): boolean {
    return this.config.server.readOnly;
  }

  /**
   * Get base URL
   */
  getBaseUrl(): string {
    return this.config.nexus.baseUrl;
  }
}