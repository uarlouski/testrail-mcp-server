# Getting Started

The **TestRail MCP Server** connects Claude, Cursor, Windsurf, and other AI assistants directly to your TestRail instance.

## Prerequisites

1.  **TestRail Account**: You need an active TestRail account.
2.  **API Key**: Generate a new API key in TestRail under **My Settings → API Keys**.

## Installation

### For Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "testrail": {
      "command": "npx",
      "args": ["-y", "@uarlouski/testrail-mcp-server@latest"],
      "env": {
        "TESTRAIL_INSTANCE_URL": "https://your-instance.testrail.io",
        "TESTRAIL_USERNAME": "your@email.com",
        "TESTRAIL_API_KEY": "your-api-key"
      }
    }
  }
}
```

### For Cursor

Open **Settings → Features → MCP** and add a new configuration using the exact same arguments and environment variables as above.

## Next Steps

Check out the [Configuration](./configuration.md) page to learn about all the available environment variables and permissions.
