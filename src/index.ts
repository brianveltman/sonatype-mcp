#!/usr/bin/env node

// Add early debug and error handling for npx issues
console.error('=== MCP Server Starting ===');
console.error('process.argv:', process.argv);
console.error('process.cwd():', process.cwd());
console.error('import.meta.url:', import.meta.url);

// Handle missing dependencies gracefully
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception during startup:', error.message);
  if (error.message.includes('Cannot find package')) {
    console.error('');
    console.error('ERROR: Missing dependencies. If running via npx, this may be a temporary issue.');
    console.error('Please ensure all dependencies are installed correctly.');
    console.error('Try running: npm install -g @brianveltman/sonatype-mcp');
    console.error('');
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection during startup:', reason);
  process.exit(1);
});

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createConfig, displayUsage, type Config } from './config/environment.js';
import { NexusClient } from './services/nexus-client.js';
import { createTools, getToolByName } from './tools/index.js';
import { formatMCPError } from './utils/errors.js';

/**
 * Main MCP server for Nexus Repository Manager
 */
class NexusMCPServer {
  private server: Server;
  private nexusClient: NexusClient | null = null;
  private tools: any[] = [];
  private config: Config | null = null;

  constructor() {
    // Initialize server with default values, config will be loaded later
    this.server = new Server(
      {
        name: 'mcp-sonatype',
        version: '1.3.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
  }

  private initializeWithConfig() {
    try {
      // Load configuration
      this.config = createConfig();
      
      // Initialize Nexus client
      this.nexusClient = new NexusClient(this.config);
      this.tools = createTools(this.nexusClient, this.config);

      this.setupHandlers();
    } catch (error) {
      console.error('Failed to initialize configuration:', error);
      throw error;
    }
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const tool = getToolByName(this.tools, name);

      if (!tool) {
        throw new Error(`Tool not found: ${name}`);
      }

      try {
        console.error(`Executing tool: ${name}`);
        const result = await (tool as any).handler(args || {});
        console.error(`Tool execution completed: ${name}`);
        return result;
      } catch (error) {
        console.error(`Tool execution failed: ${name}`, error);
        const mcpError = formatMCPError(error as Error);
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${mcpError.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  async start() {
    try {
      // Check for help flag
      if (process.argv.includes('--help') || process.argv.includes('-h')) {
        displayUsage();
        process.exit(0);
      }

      console.error('Starting Nexus MCP Server...');
      
      // Initialize configuration and components
      this.initializeWithConfig();
      
      if (!this.config || !this.nexusClient) {
        throw new Error('Failed to initialize server configuration');
      }

      console.error(`Server: ${this.config.server.name} v${this.config.server.version}`);
      console.error(`Nexus URL: ${this.config.nexus.baseUrl}`);
      console.error(`Username: ${this.config.nexus.username}`);
      console.error(`Read-only mode: ${this.config.server.readOnly}`);
      console.error(`Available tools: ${this.tools.length}`);

      // Test connection to Nexus (don't fail if connection fails)
      console.error('Testing connection to Nexus...');
      try {
        const isConnected = await this.nexusClient.testConnection();
        if (!isConnected) {
          console.error('Warning: Could not connect to Nexus server');
        } else {
          console.error('Successfully connected to Nexus');
        }
      } catch (error) {
        console.error('Warning: Could not test connection to Nexus:', error);
      }

      // Start the server
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('Nexus MCP Server started successfully');

    } catch (error) {
      console.error('Failed to start server:', error);
      // Don't exit immediately - let the MCP framework handle this
      throw error;
    }
  }

  async stop() {
    try {
      console.error('Stopping Nexus MCP Server...');
      await this.server.close();
      console.error('Server stopped');
    } catch (error) {
      console.error('Error stopping server:', error);
    }
  }
}

// Handle process signals
process.on('SIGINT', async () => {
  console.error('\nReceived SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('\nReceived SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the server - always start when this module is loaded
// This ensures the server starts regardless of how it's invoked (node, npx, etc.)
console.error('Module loaded, starting server...');
console.error('process.argv:', process.argv);
console.error('import.meta.url:', import.meta.url);

const server = new NexusMCPServer();
server.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});