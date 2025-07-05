/**
 * Custom error class for Nexus-related errors
 */
export class NexusError extends Error {
  public readonly statusCode: number;
  public readonly nexusResponse?: any;

  constructor(
    message: string,
    statusCode: number,
    nexusResponse?: any
  ) {
    super(message);
    this.name = 'NexusError';
    this.statusCode = statusCode;
    this.nexusResponse = nexusResponse;
    
    // Ensure proper prototype chain
    Object.setPrototypeOf(this, NexusError.prototype);
  }
}

/**
 * Error for configuration-related issues
 */
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

/**
 * Error for authentication-related issues
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Error for validation-related issues
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Handle HTTP errors from Nexus API
 */
export function handleNexusError(error: any): never {
  if (error.response) {
    const { status, data } = error.response;
    const message = data?.message || data?.error || 'Unknown API error';
    
    if (status === 401) {
      throw new AuthenticationError(`Authentication failed: ${message}`);
    } else if (status === 403) {
      throw new AuthenticationError(`Access denied: ${message}`);
    } else if (status === 404) {
      throw new NexusError(`Resource not found: ${message}`, status, data);
    } else if (status >= 400 && status < 500) {
      throw new ValidationError(`Client error: ${message}`);
    } else {
      throw new NexusError(`Nexus API error: ${message}`, status, data);
    }
  } else if (error.request) {
    throw new NexusError(`Network error: Unable to connect to Nexus server`, 0);
  } else {
    throw new NexusError(`Request setup error: ${error.message}`, 0);
  }
}

/**
 * Format error for MCP response
 */
export function formatMCPError(error: Error): { code: string; message: string } {
  if (error instanceof NexusError) {
    return {
      code: `NEXUS_ERROR_${error.statusCode}`,
      message: error.message
    };
  } else if (error instanceof AuthenticationError) {
    return {
      code: 'AUTHENTICATION_ERROR',
      message: error.message
    };
  } else if (error instanceof ValidationError) {
    return {
      code: 'VALIDATION_ERROR',
      message: error.message
    };
  } else if (error instanceof ConfigurationError) {
    return {
      code: 'CONFIGURATION_ERROR',
      message: error.message
    };
  } else {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred'
    };
  }
}