---
title: Getting Started
description: Set up the TestRail MCP Server in Claude Desktop, Cursor, Windsurf, or VS Code — TestRail API keys, environment variables, and verifying the connection.
faq: true
---

# How to connect an AI assistant to TestRail

This guide sets up the **TestRail MCP Server** end to end. It takes about five minutes: generate a TestRail API key, paste a short JSON block into your AI assistant's configuration, restart the client, and ask it to list your projects.

There is nothing to install, build, host, or deploy. The server is an npm package that your MCP client launches on demand with `npx`, running locally on your own machine and talking directly to your TestRail instance.

## Prerequisites

| Requirement | Notes |
| --- | --- |
| **Node.js 18 or newer** | Check with `node --version`. `npx` ships with Node. |
| **A TestRail account** | TestRail Cloud or self-hosted TestRail Server both work. |
| **A TestRail API key** | Created in TestRail itself — see step 1 below. |
| **An MCP client** | Claude Desktop, Cursor, Windsurf, VS Code, or any MCP-compliant client. |

The server is tested against **TestRail 10.6.2 (API v2)** and remains backward compatible with older instances, including pre-7.x pagination behaviour.

## Step 1: Generate a TestRail API key

1. Sign in to TestRail and open **My Settings** from the user menu in the top-right corner.
2. Switch to the **API Keys** tab.
3. Click **Add Key**, give it a name such as `mcp-server`, and generate it.
4. Copy the key immediately. TestRail displays it only once.

> [!IMPORTANT]
> The TestRail API also has to be enabled for the whole instance under **Administration → Site Settings → API**. If API access is switched off, every request fails with an authentication error no matter how valid your key is. Enabling it requires an administrator.

## Step 2: Configure your MCP client

Every client needs the same three things: the `npx` command, the package name, and three environment variables.

| Variable | Example | Description |
| --- | --- | --- |
| `TESTRAIL_INSTANCE_URL` | `https://example.testrail.io` | Full instance URL, including `https://` |
| `TESTRAIL_USERNAME` | `qa@example.com` | The email address you sign in with |
| `TESTRAIL_API_KEY` | `Xy1z…` | The key from step 1 |

### Claude Desktop

Edit `claude_desktop_config.json` — on macOS it lives at `~/Library/Application Support/Claude/claude_desktop_config.json`, and on Windows at `%APPDATA%\Claude\claude_desktop_config.json`. You can also open it from **Settings → Developer → Edit Config**.

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

### Cursor

Open **Settings → MCP → Add new MCP server**, or edit `.cursor/mcp.json` in your project (for one repository) or `~/.cursor/mcp.json` (for every project). The configuration is identical to Claude Desktop's:

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

### Windsurf

Edit `~/.codeium/windsurf/mcp_config.json`, or use **Settings → Cascade → MCP Servers → Add Server**:

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

### VS Code

Add the server to `.vscode/mcp.json` in your workspace. VS Code wraps the entries in a `servers` key and supports `inputs` so the API key can be prompted for instead of committed:

```json
{
  "inputs": [
    {
      "id": "testrail-api-key",
      "type": "promptString",
      "description": "TestRail API key",
      "password": true
    }
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

### Any other MCP client

The pattern is the same everywhere, because the server uses the standard MCP **stdio** transport. Point the client at `npx -y @uarlouski/testrail-mcp-server@latest` and give it the three environment variables. No port, URL, or transport configuration is needed.

## Step 3: Restart and verify

Restart your MCP client completely. Most clients read their configuration only at launch, so reloading a window is not always enough.

Then confirm the connection by asking your assistant:

> "List all the projects in TestRail."

A successful reply names your real TestRail projects with their IDs. If the assistant says it has no TestRail tools available, see [troubleshooting](#troubleshooting) below.

## Step 4: Try a real workflow

With the connection working, these prompts all run out of the box:

- *"Show me every test case in section 5 of project 3."*
- *"Which custom fields are required to create a case in project 3?"*
- *"Write a test case for password reset with detailed steps and add it to the Authentication section."*
- *"Create a test run with the cases from section 5 and assign it to me."*
- *"Mark test case C1042 as passed with the comment 'verified on staging'."*
- *"Attach the screenshots folder to test run 88."*

## Recommended next steps

- **Turn on the optional features you need.** Shared steps, test case history, and the RAG export are off by default. See [Configuration](./configuration.md).
- **Tighten permissions.** Decide whether the assistant should be able to write or delete at all. Deletes are already off by default; the [Configuration guide](./configuration.md) covers read-only and least-privilege setups.
- **Browse the tools.** The [tool reference](../reference/) lists all 34 tools with their parameters.
- **Automate without an LLM.** The bundled [`testrail-cli`](./cli.md) runs the same tools from shell scripts and CI pipelines.

## Troubleshooting

### Why does my AI assistant not show any TestRail tools?

Restart the client fully, not just the window, since most MCP clients load their configuration once at launch. Then check that the JSON file is valid — a trailing comma is enough to make the client silently skip the server — and that `npx` is available on the `PATH` in the environment the client launches from. Most clients expose the server's stderr in an MCP or extension log, which will show the real error.

### Why does the server reject my credentials?

`TESTRAIL_INSTANCE_URL` must be a complete URL with its scheme, so `https://example.testrail.io` rather than `example.testrail.io`. `TESTRAIL_USERNAME` must be the email address you sign in with, not a display name or user ID. If both look right, confirm that the API is enabled instance-wide under **Administration → Site Settings → API**, and that the key was copied in full.

### Why is `npx` downloading the package every time?

`npx -y @uarlouski/testrail-mcp-server@latest` deliberately resolves the newest version on each launch, so you always start an up-to-date server. To pin a version and skip the lookup, replace `@latest` with an exact version such as `@2.10.0`, or install the package locally and point `command` at the installed binary.

### Can I keep the API key out of my configuration file?

In VS Code, use the `inputs` block shown above so the key is prompted for and stored in the editor's secret storage. In other clients, most support referencing an environment variable already present in the shell that launches them. Whichever approach you take, keep client configuration files out of version control.
