import { Config } from '../config/environment.js';

/**
 * Generate Basic Authentication header
 */
export function generateBasicAuthHeader(username: string, password: string): string {
  const credentials = Buffer.from(`${username}:${password}`).toString('base64');
  return `Basic ${credentials}`;
}

/**
 * Create authentication headers for Nexus API requests
 */
export function createAuthHeaders(config: Config): Record<string, string> {
  return {
    'Authorization': generateBasicAuthHeader(config.nexus.username, config.nexus.password),
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
}

/**
 * Validate authentication credentials
 */
export function validateCredentials(config: Config): boolean {
  if (!config.nexus.username || !config.nexus.password) {
    return false;
  }
  
  // Basic validation - check for non-empty strings
  return config.nexus.username.length > 0 && config.nexus.password.length > 0;
}