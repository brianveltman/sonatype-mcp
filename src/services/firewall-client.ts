import axios, { AxiosInstance } from 'axios';
import { Config } from '../config/environment.js';
import { handleNexusError, AuthenticationError } from '../utils/errors.js';
import { RequestOptions } from './nexus-client.js';

/**
 * Firewall credentials validator
 */
function validateFirewallCredentials(config: Config): boolean {
  return !!(config.firewall?.username && config.firewall?.password);
}

/**
 * Create auth headers for Firewall
 */
function createFirewallAuthHeaders(config: Config): Record<string, string> {
  if (!config.firewall?.username || !config.firewall?.password) {
    return {};
  }
  
  const credentials = Buffer.from(`${config.firewall.username}:${config.firewall.password}`).toString('base64');
  return {
    'Authorization': `Basic ${credentials}`
  };
}

/**
 * Sonatype Firewall REST API client
 */
export class FirewallClient {
  private readonly client: AxiosInstance;
  private readonly config: Config;

  constructor(config: Config) {
    if (!config.firewall) {
      throw new AuthenticationError('Firewall configuration is not available. Please provide firewall credentials.');
    }

    this.config = config;
    
    // Create axios instance with default configuration
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // Add auth headers only if credentials are provided
    if (validateFirewallCredentials(config)) {
      Object.assign(headers, createFirewallAuthHeaders(config));
    }
    
    this.client = axios.create({
      baseURL: config.firewall.baseUrl,
      timeout: config.firewall.timeout,
      headers,
      validateStatus: () => true, // We'll handle all status codes manually
      ...(config.firewall.validateSsl === false && {
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false
        })
      })
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        if (this.config.server?.name) {
          console.log(`[${this.config.server.name}] Firewall API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => {
        console.error('Firewall API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        if (this.config.server?.name) {
          console.log(`[${this.config.server.name}] Firewall API Response: ${response.status} ${response.statusText}`);
        }
        return response;
      },
      (error) => {
        console.error('Firewall API Response Error:', error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check if authentication credentials are available
   */
  private hasCredentials(): boolean {
    return validateFirewallCredentials(this.config);
  }

  /**
   * Ensure credentials are available before making authenticated requests
   */
  private ensureCredentials(): void {
    if (!this.hasCredentials()) {
      throw new AuthenticationError('Firewall credentials not configured. Please set --firewall-username and --firewall-password arguments or FIREWALL_USERNAME and FIREWALL_PASSWORD environment variables.');
    }
  }

  /**
   * Test the connection to Firewall
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try a simple endpoint to test connectivity
      const response = await this.client.get('/api/v2/reports/components/quarantined?limit=1');
      return response.status < 400;
    } catch (error) {
      console.error('Firewall connection test failed:', error);
      return false;
    }
  }

  /**
   * Make a GET request to Firewall API
   */
  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    this.ensureCredentials();
    
    try {
      const headers = { ...options.headers };
      
      // Add auth headers
      Object.assign(headers, createFirewallAuthHeaders(this.config));
      
      const response = await this.client.get<T>(endpoint, {
        ...options,
        headers
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
   * Make a POST request to Firewall API
   */
  async post<T>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<T> {
    if (this.config.server.readOnly) {
      throw new AuthenticationError('Write operations are disabled in read-only mode');
    }

    this.ensureCredentials();

    try {
      const response = await this.client.post<T>(endpoint, data, {
        ...options,
        headers: {
          ...createFirewallAuthHeaders(this.config),
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
   * Make a PUT request to Firewall API
   */
  async put<T>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<T> {
    if (this.config.server.readOnly) {
      throw new AuthenticationError('Write operations are disabled in read-only mode');
    }

    this.ensureCredentials();

    try {
      const response = await this.client.put<T>(endpoint, data, {
        ...options,
        headers: {
          ...createFirewallAuthHeaders(this.config),
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
   * Make a DELETE request to Firewall API
   */
  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    if (this.config.server.readOnly) {
      throw new AuthenticationError('Write operations are disabled in read-only mode');
    }

    this.ensureCredentials();

    try {
      const response = await this.client.delete<T>(endpoint, {
        ...options,
        headers: {
          ...createFirewallAuthHeaders(this.config),
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
}