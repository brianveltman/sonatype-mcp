import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
  NEXUS_BASE_URL: z.string().url().default('http://localhost:8081'),
  NEXUS_USERNAME: z.string().min(1, 'NEXUS_USERNAME is required'),
  NEXUS_PASSWORD: z.string().min(1, 'NEXUS_PASSWORD is required'),
  NEXUS_TIMEOUT: z.string().regex(/^\d+$/).transform(Number).default('30000'),
  NEXUS_VALIDATE_SSL: z.string().transform(val => val !== 'false').default('true'),
  MCP_SERVER_NAME: z.string().default('nexus-mcp-server'),
  MCP_SERVER_VERSION: z.string().default('1.0.0'),
  READ_ONLY_MODE: z.string().transform(val => val === 'true').default('false'),
  ENABLED_TOOLS: z.string().optional().transform(val => val ? val.split(',').map(s => s.trim()) : [])
});

// Parse and validate environment variables
export function loadEnvironment() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('Environment validation failed:', error);
    process.exit(1);
  }
}

// Configuration interface
export interface Config {
  nexus: {
    baseUrl: string;
    username: string;
    password: string;
    timeout: number;
    validateSsl: boolean;
  };
  server: {
    name: string;
    version: string;
    readOnly: boolean;
  };
  features: {
    enabledTools: string[];
  };
}

// Create configuration object
export function createConfig(): Config {
  const env = loadEnvironment();
  
  return {
    nexus: {
      baseUrl: env.NEXUS_BASE_URL,
      username: env.NEXUS_USERNAME,
      password: env.NEXUS_PASSWORD,
      timeout: env.NEXUS_TIMEOUT,
      validateSsl: env.NEXUS_VALIDATE_SSL
    },
    server: {
      name: env.MCP_SERVER_NAME,
      version: env.MCP_SERVER_VERSION,
      readOnly: env.READ_ONLY_MODE
    },
    features: {
      enabledTools: env.ENABLED_TOOLS
    }
  };
}

// Export default configuration
export const config = createConfig();