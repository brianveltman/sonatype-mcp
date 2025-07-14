# Sonatype MCP Server

A Model Context Protocol (MCP) server for Sonatype Nexus Repository Manager that enables AI assistants to interact with Nexus repositories through a standardized interface.

![NPM Downloads](https://img.shields.io/npm/d18m/%40brianveltman%2Fsonatype-mcp)

## Features

- **Repository Management**: List, view, and manage repositories
- **Component Operations**: Search, retrieve, and manage components
- **System Administration**: Monitor system status, blob stores, and metrics
- **Security**: HTTP Basic Authentication with read-only mode support

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

#### With Firewall Quarantine Support

To enable Firewall quarantine tools, add Firewall credentials:

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
        "--nexus-password", "your-password",
        "--firewall-url", "http://localhost:8070",
        "--firewall-username", "firewall-user",
        "--firewall-password", "firewall-password"
      ]
    }
  }
}
```

### Visual Studio Code Integration

Add to your `mcp.json`:

```json
{
	"servers": {
		"sonatype-mcp": {
			"command": "npx",
			"args": [
				"-y",
				"@brianveltman/sonatype-mcp",
				"--nexus-url",
				"http://localhost:8081",
				"--nexus-username",
				"your-username",
				"--nexus-password",
				"your-password"
			],
			"type": "stdio"
		}
	},
	"inputs": []
}
```

#### With Firewall Support

```json
{
	"servers": {
		"sonatype-mcp": {
			"command": "npx",
			"args": [
				"-y",
				"@brianveltman/sonatype-mcp",
				"--nexus-url",
				"http://localhost:8081",
				"--nexus-username",
				"your-username",
				"--nexus-password",
				"your-password",
				"--firewall-url",
				"http://localhost:8070",
				"--firewall-username",
				"firewall-user",
				"--firewall-password",
				"firewall-password"
			],
			"type": "stdio"
		}
	},
	"inputs": []
}
```

## Available Tools

### Repository Management
- `nexus_list_repositories` - List all repositories with filtering
- `nexus_get_repository` - Get repository details
- `nexus_create_repository` - Create proxy, hosted, or group repositories (write mode)
- `nexus_update_repository` - Update repository configuration (write mode)
- `nexus_delete_repository` - Delete repositories (write mode)

### Component Management
- `nexus_search_components` - Search components across repositories
- `nexus_get_component` - Get component details
- `nexus_delete_component` - Delete components (write mode)
- `nexus_get_component_versions` - List all versions of a component
- `nexus_upload_component` - Upload components with assets to repositories (write mode)

### Asset Management
- `nexus_upload_asset` - Upload individual assets to raw repositories (write mode)

### System Administration
- `nexus_get_system_status` - Get system health status
- `nexus_list_blob_stores` - List blob store configurations
- `nexus_list_tasks` - List scheduled tasks
- `nexus_get_usage_metrics` - Get usage metrics including total components and daily request counts (requires nexus:metrics:read privilege)
- `nexus_generate_support_zip` - Generate and optionally save a support zip file containing diagnostic information for troubleshooting

### Firewall Quarantine (Optional)
- `firewall_get_quarantined_components` - Retrieve components quarantined by Sonatype Firewall policies (requires Firewall credentials)
- `firewall_release_from_quarantine` - Release components from Firewall quarantine by waiving policy violations (write mode, requires Firewall credentials)

## Usage Examples

### Common Prompts for AI Assistants

Once you have the MCP server configured, you can use natural language prompts with your AI assistant:

#### Repository Management
- *"List all Maven repositories"*
- *"Show me details about the npm-public repository"*
- *"Create a new hosted Maven repository called 'internal-releases'"*
- *"What repositories do we have for Docker images?"*

#### Component Search and Analysis
- *"Search for all versions of the Spring Boot starter components"*
- *"Find all components in the maven-central repository that contain 'jackson'"*
- *"Show me all versions of com.fasterxml.jackson.core:jackson-core"*
- *"What's the latest version of lodash in our npm repository?"*

#### System Monitoring
- *"Check the system health status"*
- *"Show me the current usage metrics for our Nexus instance"*
- *"List all blob stores and their sizes"*
- *"What scheduled tasks are currently running?"*
- *"Generate a support zip file for troubleshooting"*
- *"Create a support zip with system info and logs, save it to the raw repository"*

#### Security and Compliance
- *"Search for components with known vulnerabilities"*
- *"Find all snapshot versions in our release repositories"*
- *"Show me components uploaded in the last 24 hours"*
- *"Show me all components quarantined by Firewall policies"*
- *"Check if any components containing 'log4j' are quarantined"*
- *"Release quarantine ID 'abc123' with a comment explaining the business justification"*

### Advanced Use Cases

#### Dependency Analysis
```
"Search for all components that depend on log4j and show me their versions. 
Then check if any of them are using vulnerable versions."
```

#### Repository Cleanup
```
"Find all snapshot artifacts older than 30 days in the maven-snapshots repository 
and prepare a list for cleanup."
```

#### Release Management
```
"Check if version 2.1.0 of our internal library 'com.company:core-utils' 
exists in the releases repository, and if not, help me upload it."
```

#### Storage Management
```
"Show me which blob stores are consuming the most space and identify 
the largest components in each repository."
```

#### Troubleshooting and Support
```
"Generate a comprehensive support zip file including system information, 
thread dumps, metrics, and log files, but exclude security information 
for sharing with external support."
```

#### Firewall Quarantine Management
```
"Check all repositories for quarantined components, identify which policy 
violations are causing the most quarantines, and provide a summary report 
with recommendations for policy adjustments."
```

### Interactive Workflows

The MCP server enables complex, multi-step workflows:

1. **Component Discovery**: Start by searching for components
2. **Detailed Analysis**: Get specific component details
3. **Repository Operations**: Create, update, or manage repositories
4. **Upload Management**: Upload new versions or assets
5. **Monitoring**: Check system health and usage metrics

### Example Conversation Flow

```
You: "What Maven repositories do we have?"
AI: [Lists repositories using nexus_list_repositories]

You: "Show me the largest components in maven-releases"
AI: [Searches components and shows results with sizes]

You: "Upload version 1.2.0 of com.example:my-app to maven-releases"
AI: [Uses nexus_upload_component to upload the specified version]

You: "Check if the upload was successful"
AI: [Searches for the component to verify upload]
```

### Troubleshooting Examples

#### Permission Issues
If you encounter permission errors:
- *"Check the system status to see if I have the required permissions"*
- *"List the repositories I have access to"*
- *"Show me what admin tasks are available"*

#### Component Not Found
When searching doesn't return expected results:
- *"Search for 'spring' in all repositories, not just maven-central"*
- *"Check if the component name has special characters or different casing"*
- *"List all components in the repository to see what's actually there"*

#### Upload Issues
For upload problems:
- *"Verify the repository format supports the type of component I'm trying to upload"*
- *"Check if the repository is in read-only mode"*
- *"Show me the repository configuration for upload settings"*

### Best Practices

#### Efficient Searching
- Use specific search terms to reduce result sets
- Filter by repository when you know the target location
- Combine multiple search criteria for precise results

#### Repository Management
- Always check repository details before making changes
- Use descriptive names for new repositories
- Verify blob store configuration before creating repositories

#### Monitoring and Maintenance
- Regularly check system health status
- Monitor usage metrics to understand growth patterns
- Review scheduled tasks for maintenance operations

### Integration Examples

#### CI/CD Pipeline Integration
```
"After our build completes, check if the new artifact version already exists 
in the releases repository. If not, upload it and verify the upload succeeded."
```

#### Dependency Auditing
```
"Generate a report of all third-party dependencies in our maven-central proxy, 
grouped by organization, and highlight any with recent security advisories."
```

#### Storage Optimization
```
"Identify duplicate artifacts across repositories and suggest consolidation 
opportunities to optimize storage usage."
```

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

### Example how to use the source with Claude
```json
{
  "mcpServers": {
    "sonatype-mcp": {
      "command": "node",
      "args": [
        "/path-to/mcp-sonatype/build/index.js",
        "--nexus-url",
        "http://localhost:8081",
        "--nexus-username",
        "your-username",
        "--nexus-password",
        "your-password"
      ]
    }
  }
}
```

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: https://github.com/brianveltman/sonatype-mcp/issues

## References

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Nexus Repository Manager API](https://help.sonatype.com/en/repositories-api.html)
- [Sonatype Nexus Repository Manager](https://help.sonatype.com/)