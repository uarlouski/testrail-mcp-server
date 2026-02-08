# TestRail MCP Server

A Model Context Protocol (MCP) server for integrating LLMs with TestRail test case management.

## Usage

```json
{
  "mcpServers": {
    "testrail": {
      "command": "npx",
      "args": [
        "@uarlouski/testrail-mcp-server@latest"
      ],
      "env": {
        "TESTRAIL_INSTANCE_URL": "https://your-instance.testrail.io",
        "TESTRAIL_USERNAME": "your@email.com",
        "TESTRAIL_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Tools

| Tool | Description |
|------|-------------|
| `get_projects` | Discover available projects in your TestRail instance |
| `get_case` | Fetch detailed test case info including custom fields |
| `get_cases` | Query cases with filtering and pagination support |
| `get_case_fields` | Explore available fields and dropdown options |
| `get_templates` | List project templates to understand case structures |
| `get_sections` | Navigate the test case hierarchy |
| `create_case` | Create new test cases with full custom field support |
| `update_case` | Modify a single test case |
| `update_cases` | Bulk update multiple cases at once |

## License

Apache 2.0
