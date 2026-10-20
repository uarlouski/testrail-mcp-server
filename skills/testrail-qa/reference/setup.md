# Setup: connect the TestRail MCP Server

Use this when the TestRail tools are not available to the agent.

## 1. Prerequisites

- Node.js 18+ (`node --version`)
- A TestRail account (Cloud or Server) with the API enabled instance-wide
  (*Administration → Site Settings → API* — requires an admin)
- A TestRail API key: *My Settings → API Keys → Add Key*. It is shown only once.

## 2. Add the server to the MCP client

Same block for Claude Desktop, Cursor (`.cursor/mcp.json` or `~/.cursor/mcp.json`),
Windsurf (`~/.codeium/windsurf/mcp_config.json`), Gemini CLI, and most other clients:

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

VS Code (`.vscode/mcp.json`) uses `"servers"` instead of `"mcpServers"` and can prompt for the
key so it is never written to disk:

```json
{
  "inputs": [
    { "id": "testrail-api-key", "type": "promptString", "description": "TestRail API key", "password": true }
  ],
  "servers": {
    "testrail": {
      "command": "npx",
      "args": ["-y", "@uarlouski/testrail-mcp-server@latest"],
      "env": {
        "TESTRAIL_INSTANCE_URL": "https://your-instance.testrail.io",
        "TESTRAIL_USERNAME": "your@email.com",
        "TESTRAIL_API_KEY": "${input:testrail-api-key}"
      }
    }
  }
}
```

Restart the client fully, then ask: *"List my TestRail projects."*

> Tell the user to keep this config out of version control. Never ask the user to paste their
> API key into the chat.

## 3. Optional feature flags

Add to `env` only when the workflow needs them:

| Variable | Default | Enables |
| --- | --- | --- |
| `TESTRAIL_ENABLE_SHARED_STEPS` | `false` | Shared steps tools |
| `TESTRAIL_ENABLE_CASE_HISTORY` | `false` | `get_case_history` |
| `TESTRAIL_ENABLE_RAG_TOOLS` | `false` | `export_cases_for_rag` (experimental) |
| `TESTRAIL_ALLOW_WRITE_OPERATIONS` | `true` | Create/update tools — set `false` for read-only |
| `TESTRAIL_ALLOW_DELETE_OPERATIONS` | `false` | `delete_entity` |
| `TESTRAIL_DISABLED_TOOLS` | — | Comma-separated tool names to hide |

## 4. Troubleshooting

- **No tools appear** — invalid JSON (trailing comma), `npx` not on the client's `PATH`, or
  the client was not fully restarted. Check the client's MCP log for stderr.
- **Auth rejected** — URL missing `https://`, username is not the login email, key truncated,
  or API disabled instance-wide.
