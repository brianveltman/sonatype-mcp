import { z } from 'zod';

// Environment variable schema (fallback)
const envSchema = z.object({
  NEXUS_BASE_URL: z.string().url().default('http://localhost:8081'),
  NEXUS_USERNAME: z.string().default(''),
  NEXUS_PASSWORD: z.string().default(''),
  NEXUS_TIMEOUT: z.string().regex(/^\d+$/).transform(Number).default('30000'),
  NEXUS_VALIDATE_SSL: z.string().transform(val => val !== 'false').default('true'),
  MCP_SERVER_NAME: z.string().default('sonatype-mcp'),
  MCP_SERVER_VERSION: z.string().default('1.0.13'),
  READ_ONLY_MODE: z.string().transform(val => val === 'true').default('false'),
  ENABLED_TOOLS: z.string().optional().transform(val => val ? val.split(',').map(s => s.trim()) : [])
});

// Parse command line arguments
function parseArgs(): Record<string, any> {
  const args: Record<string, any> = {};
  const argv = process.argv.slice(2);
  
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextArg = argv[i + 1];
      
      // Handle boolean flags
      if (key === 'debug' || key === 'read-only' || key === 'nexus-validate-ssl') {
        args[key] = true;
        continue;
      }
      
      // Handle key-value pairs
      if (nextArg && !nextArg.startsWith('--')) {
        args[key] = nextArg;
        i++; // Skip next argument as it's the value
      }
    }
  }
  
  return args;
}

// Parse and validate configuration from args and environment
export function loadEnvironment() {
  try {
    const cmdArgs = parseArgs();
    const env = envSchema.parse(process.env);
    
    // Command line arguments take precedence over environment variables
    const config = {
      baseUrl: cmdArgs['nexus-url'] || env.NEXUS_BASE_URL,
      username: cmdArgs['nexus-username'] || env.NEXUS_USERNAME,
      password: cmdArgs['nexus-password'] || env.NEXUS_PASSWORD,
      timeout: cmdArgs['nexus-timeout'] || env.NEXUS_TIMEOUT,
      validateSsl: cmdArgs['nexus-validate-ssl'] !== false && env.NEXUS_VALIDATE_SSL,
      serverName: env.MCP_SERVER_NAME,
      serverVersion: env.MCP_SERVER_VERSION,
      readOnly: cmdArgs['read-only'] || env.READ_ONLY_MODE,
      enabledTools: cmdArgs['enabled-tools'] || env.ENABLED_TOOLS,
      debug: cmdArgs['debug'] || false
    };
    
    // Check if credentials are provided (warning only, don't exit)
    if (!config.username || !config.password) {
      console.error('Warning: Nexus credentials not provided via --nexus-username and --nexus-password arguments or environment variables.');
      console.error('Server will start but tools will fail without authentication.');
      console.error('Usage: node build/index.js --nexus-url http://localhost:8081 --nexus-username admin --nexus-password admin123');
    }
    
    return config;
  } catch (error) {
    console.error('Configuration validation failed:', error);
    console.error('Usage: node build/index.js --nexus-url http://localhost:8081 --nexus-username admin --nexus-password admin123');
    // Don't exit here - let the MCP server handle the error
    throw error;
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
  const config = loadEnvironment();
  
  return {
    nexus: {
      baseUrl: config.baseUrl,
      username: config.username,
      password: config.password,
      timeout: config.timeout,
      validateSsl: config.validateSsl
    },
    server: {
      name: config.serverName,
      version: config.serverVersion,
      readOnly: config.readOnly
    },
    features: {
      enabledTools: config.enabledTools
    }
  };
}

// Helper function to display usage information
export function displayUsage() {
  console.log(`
Sonatype Nexus MCP Server

Usage: node build/index.js [options]

Options:
  --nexus-url <url>          Nexus base URL (default: http://localhost:8081)
  --nexus-username <user>    Nexus username (required)
  --nexus-password <pass>    Nexus password (required)
  --nexus-timeout <ms>       Request timeout in milliseconds (default: 30000)
  --nexus-validate-ssl       Validate SSL certificates (default: true)
  --read-only               Enable read-only mode (default: false)
  --enabled-tools <tools>    Comma-separated list of enabled tools
  --debug                   Enable debug mode
  --help                    Show this help message

Examples:
  node build/index.js --nexus-username admin --nexus-password admin123
  node build/index.js --nexus-url https://nexus.example.com --nexus-username myuser --nexus-password mypass
  node build/index.js --nexus-username admin --nexus-password admin123 --read-only
`);
}
