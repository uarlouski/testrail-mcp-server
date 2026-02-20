<p align="center">
  <h1 align="center">TestRail MCP Server</h1>
  <p align="center">
    A Model Context Protocol (MCP) server that connects AI assistants to TestRail test management — search, create, update, and execute test cases using natural language.
  </p>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@uarlouski/testrail-mcp-server"><img src="https://badge.fury.io/js/@uarlouski%2Ftestrail-mcp-server.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@uarlouski/testrail-mcp-server"><img src="https://img.shields.io/npm/dm/@uarlouski/testrail-mcp-server.svg" alt="npm downloads"></a>
  <a href="https://github.com/uarlouski/testrail-mcp-server/actions/workflows/ci.yml"><img src="https://github.com/uarlouski/testrail-mcp-server/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://opensource.org/licenses/Apache-2.0"><img src="https://img.shields.io/badge/License-Apache_2.0-blue.svg" alt="License"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.9-blue.svg" alt="TypeScript"></a>
  <a href="https://github.com/uarlouski/testrail-mcp-server"><img src="https://img.shields.io/github/stars/uarlouski/testrail-mcp-server.svg?style=social&label=Star" alt="GitHub stars"></a>
</p>

---

## Why TestRail MCP Server?

Managing test cases manually is tedious. With the TestRail MCP Server, your AI assistant (Claude, Cursor, Windsurf, or any MCP-compliant client) talks directly to TestRail. Ask it to find test cases, create new ones, kick off test runs, or report results — all through natural conversation.

**No context switching. No copy-pasting. Just ask.**

## ✨ Features

| Category | Capabilities |
|----------|-------------|
| **🔍 Discovery** | Browse projects, suites, and sections to map your test organization |
| **📋 Case Management** | Fetch, create, update, and bulk-edit test cases with full custom field support |
| **▶️ Test Execution** | Create runs, record results, attach files, and track test statuses |
| **🧠 Context-Aware** | Exposes templates, field definitions, priorities, and case types so LLMs generate valid, well-structured test cases |

## 🚀 Quick Start

### 1. Get Your TestRail API Key

Navigate to **My Settings → API Keys** in your TestRail instance and generate a new key.

### 2. Configure Your MCP Client

Add the server to your MCP client configuration. Below are examples for popular clients.

<details>
<summary><strong>Claude Desktop</strong></summary>

Edit your `claude_desktop_config.json`:

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

</details>

<details>
<summary><strong>Cursor</strong></summary>

Open **Settings → MCP** and add a new server:

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

</details>

<details>
<summary><strong>Windsurf</strong></summary>

Add to your Windsurf MCP configuration:

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

</details>

<details>
<summary><strong>Other MCP Clients</strong></summary>

Any MCP-compliant client can use this server. The configuration pattern is the same — point it at the `npx` command with the required environment variables.

</details>

### 3. Start Using It

Once configured, ask your AI assistant things like:

- *"List all projects in TestRail"*
- *"Show me the test cases in suite 1 of project 3"*
- *"Create a test case for login validation with steps"*
- *"Start a new test run with cases from section 5"*
- *"Mark test 42 as passed with a comment"*

## ⚙️ Configuration

| Environment Variable | Description | Required |
|---------------------|-------------|:--------:|
| `TESTRAIL_INSTANCE_URL` | Your TestRail instance URL (e.g., `https://example.testrail.io`) | ✅ |
| `TESTRAIL_USERNAME` | Your TestRail email address | ✅ |
| `TESTRAIL_API_KEY` | Your TestRail API key ([how to get one](https://support.testrail.com/hc/en-us/articles/7077039051412-Accessing-the-TestRail-API)) | ✅ |

## 🛠️ Available Tools

### Discovery

| Tool | Description |
|------|-------------|
| `get_projects` | List all available projects in your TestRail instance |
| `get_sections` | Navigate the folder/section hierarchy of a test suite |

### Test Case Management

| Tool | Description |
|------|-------------|
| `get_cases` | Query test cases with filtering by priority, template, type, and more — supports pagination and recursive section fetching |
| `get_case` | Fetch complete details of a specific test case including steps and custom fields |
| `create_case` | Create a new test case with full custom field support |
| `update_case` | Modify an existing test case's fields, title, or steps |
| `update_cases` | Bulk-update multiple test cases simultaneously |

### Test Execution

| Tool | Description |
|------|-------------|
| `add_run` | Create a new test run in TestRail |
| `get_tests` | Get tests for a run, optionally filtered by status |
| `add_results` | Submit one or more test results to a run |
| `add_attachment_to_run` | Attach a file or zipped folder to a test run |

### Metadata

| Tool | Description |
|------|-------------|
| `get_statuses` | List all available test statuses (Passed, Failed, Blocked, etc.) |
| `get_case_fields` | Retrieve custom field definitions and dropdown options |
| `get_templates` | List available case templates for correct case structure |

## 🏗️ Development

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- npm

### Setup

```bash
git clone https://github.com/uarlouski/testrail-mcp-server.git
cd testrail-mcp-server
npm install
```

### Build

```bash
npm run build
```

### Run Tests

```bash
npm test
```

## 🤝 Contributing

Contributions are welcome! Please feel free to open an [issue](https://github.com/uarlouski/testrail-mcp-server/issues) or submit a pull request.

## 📜 License

This project is licensed under the [Apache License 2.0](LICENSE).

---

<p align="center">
  <b>TestRail MCP Server</b> · Built with the <a href="https://modelcontextprotocol.io">Model Context Protocol</a>
</p>

<p align="center">
  <sub>Keywords: TestRail MCP Server, Model Context Protocol, TestRail API integration, AI test management, LLM testing tools, Claude TestRail, Cursor TestRail, Windsurf TestRail, test case automation, QA AI assistant, MCP server for testing, TestRail plugin, test run management, AI-powered QA</sub>
</p>
