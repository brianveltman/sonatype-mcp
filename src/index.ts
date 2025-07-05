#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { config } from './config/environment.js';
import { NexusClient } from './services/nexus-client.js';
import { createTools, getToolByName } from './tools/index.js';
import { formatMCPError } from './utils/errors.js';

/**
 * Main MCP server for Nexus Repository Manager
 */
class NexusMCPServer {
  private server: Server;
  private nexusClient: NexusClient;
  private tools: any[];

  constructor() {
    this.server = new Server(
      {
        name: config.server.name,
        version: config.server.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.nexusClient = new NexusClient(config);
    this.tools = createTools(this.nexusClient, config);

    this.setupHandlers();
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
      console.error('Starting Nexus MCP Server...');
      console.error(`Server: ${config.server.name} v${config.server.version}`);
      console.error(`Nexus URL: ${config.nexus.baseUrl}`);
      console.error(`Read-only mode: ${config.server.readOnly}`);
      console.error(`Available tools: ${this.tools.length}`);

      // Test connection to Nexus
      console.error('Testing connection to Nexus...');
      const isConnected = await this.nexusClient.testConnection();
      if (!isConnected) {
        console.warn('Warning: Could not connect to Nexus server');
      } else {
        console.error('Successfully connected to Nexus');
      }

      // Start the server
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('Nexus MCP Server started successfully');

    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
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

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new NexusMCPServer();
  server.start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export default NexusMCPServer;