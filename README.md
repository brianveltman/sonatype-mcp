# Sonatype MCP Server

A Model Context Protocol (MCP) server for Sonatype Nexus Repository Manager that enables AI assistants to interact with Nexus repositories through a standardized interface.

## Features

- **Repository Management**: List, view, and manage repositories
- **Component Operations**: Search, retrieve, and manage components
- **System Administration**: Monitor system status, blob stores, and metrics
- **Security**: HTTP Basic Authentication with read-only mode support
- **Docker Support**: Containerized deployment

## Installation

### Prerequisites

- Node.js 18 or higher
- Access to a Nexus Repository Manager instance
- Valid Nexus credentials

### Using npm

```bash
npm install -g @brianveltman/sonatype-mcp
```

## Usage

### Claude Desktop Integration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sonatype-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@brianveltman/sonatype-mcp",
        "--nexus-url", "http://localhost:8081",
        "--nexus-username", "your-username",
        "--nexus-password", "your-password"
      ]
    }
  }
}
```

## Available Tools

### Repository Management
- `nexus_list_repositories` - List all repositories with filtering
- `nexus_get_repository` - Get repository details
- `nexus_delete_repository` - Delete repositories (write mode)

### Component Management
- `nexus_search_components` - Search components across repositories
- `nexus_get_component` - Get component details
- `nexus_delete_component` - Delete components (write mode)
- `nexus_get_component_versions` - List all versions of a component

### System Administration
- `nexus_get_system_status` - Get system health status
- `nexus_list_blob_stores` - List blob store configurations
- `nexus_get_metrics` - Get system metrics
- `nexus_list_tasks` - List scheduled tasks

## Development

### Building from Source

```bash
git clone https://github.com/brianveltman/sonatype-mcp.git
cd sonatype-mcp
yarn install
yarn build
```

### Running in Development

```bash
yarn dev
```

### Running Tests

```bash
yarn test
```

## Security

- Uses HTTP Basic Authentication
- Supports read-only mode for enhanced security
- Input validation on all parameters
- Comprehensive error handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: https://github.com/brianveltman/sonatype-mcp/issues

## References

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Nexus Repository Manager API](https://help.sonatype.com/en/repositories-api.html)
- [Sonatype Nexus Repository Manager](https://help.sonatype.com/)