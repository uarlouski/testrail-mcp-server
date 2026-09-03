<div align="center">
  <h1>🚀 TestRail MCP Server</h1>
  <p>
    <strong>An open-source Model Context Protocol (MCP) server that connects Claude, Cursor, Windsurf, and other AI assistants directly to TestRail.</strong>
  </p>
  <p>
    Manage TestRail projects, search and create test cases, kick off test runs, record results, and attach files — all through natural-language conversation with your AI assistant. Built for QA engineers and AI-assisted test automation.
  </p>
</div>

<p align="center">
  <a href="https://www.npmjs.com/package/@uarlouski/testrail-mcp-server"><img src="https://badge.fury.io/js/@uarlouski%2Ftestrail-mcp-server.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@uarlouski/testrail-mcp-server"><img src="https://img.shields.io/npm/dm/@uarlouski/testrail-mcp-server.svg" alt="npm downloads"></a>
  <a href="https://github.com/uarlouski/testrail-mcp-server/actions/workflows/ci.yml"><img src="https://github.com/uarlouski/testrail-mcp-server/actions/workflows/ci.yml/badge.svg" alt="CI Status"></a>
  <a href="https://opensource.org/licenses/Apache-2.0"><img src="https://img.shields.io/badge/License-Apache_2.0-blue.svg" alt="License"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.9-blue.svg" alt="TypeScript"></a>
  <a href="https://github.com/uarlouski/testrail-mcp-server"><img src="https://img.shields.io/github/stars/uarlouski/testrail-mcp-server.svg?style=social&label=Star" alt="GitHub stars"></a>
  <a href="https://glama.ai/mcp/servers/uarlouski/testrail-mcp-server"><img src="https://glama.ai/mcp/servers/uarlouski/testrail-mcp-server/badges/score.svg" alt="Score Badge"></a>
</p>

<p align="center">
  <strong>Compatible with:</strong>
  <img src="https://img.shields.io/badge/Claude%20Desktop-D97757?logo=anthropic&logoColor=white" alt="Claude Desktop">
  <img src="https://img.shields.io/badge/Cursor-000000?logo=cursor&logoColor=white" alt="Cursor">
  <img src="https://img.shields.io/badge/Windsurf-19A1BC?logo=codeium&logoColor=white" alt="Windsurf">
  <img src="https://img.shields.io/badge/VS%20Code-007ACC?logo=visualstudiocode&logoColor=white" alt="VS Code">
</p>

<!-- TODO: insert demo.gif — short screencast of asking "create a test case" in Claude or Cursor and seeing the case appear in TestRail -->

---

## 🌟 Why Choose TestRail MCP Server?

Managing test cases manually is tedious and error-prone. With the **TestRail MCP Server**, your AI assistant (whether it’s **Claude, Cursor, Windsurf**, or any MCP-compliant client) interacts directly with your TestRail instance. Instruct it to find test cases, draft new ones, kick off test runs, and record test results—all through natural conversation.

**No context switching. No tedious copy-pasting. Just ask your AI.**

> [!NOTE]
> **Compatibility Baseline**: The primary baseline version this MCP server is tested and validated against is **TestRail 10.6.2** (API v2). Older TestRail instances (including pre-7.x pagination) are also supported via built-in backward compatibility.

## ✨ Key Features & Capabilities

| Capability | Description |
|------------|-------------|
| **🔍 Intelligent Discovery** | Browse projects, test suites, and sections to automatically map your QA organization. |
| **📋 Full Case Management** | Fetch, create, update, and bulk-edit test cases with comprehensive custom field support. |
| **▶️ Actionable Execution** | Create test runs, update results by `test_id` or `case_id`, attach files, and track statuses. |
| **🧠 Context-Aware AI** | Dynamically exposes templates, fields, priorities, and statuses so LLMs generate valid, structured data. |

## 🚀 Quick Start Guide

### 1. Obtain Your TestRail API Key

Navigate to **My Settings → API Keys** in your TestRail platform and generate a new key for authentication.

### 2. Configure Your MCP Client

Add the server to your chosen MCP client configuration. The Claude Desktop example is shown below; Cursor, Windsurf, and other clients use the same pattern (see the collapsible sections further down).

#### 🤖 Claude Desktop

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
        "TESTRAIL_API_KEY": "your-api-key",
        "TESTRAIL_ENABLE_SHARED_STEPS": "true"
      }
    }
  }
}
```

<details>
<summary><strong>⌨️ Cursor</strong></summary>

Open **Settings → Features → MCP** and add a new configuration:

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
<summary><strong>🌊 Windsurf</strong></summary>

Update your Windsurf MCP configuration file:

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
<summary><strong>🌐 Other MCP Clients</strong></summary>

Any MCP-compliant client can utilize this server. The pattern is universal—point your client at the `npx` command with the required environment variables.
</details>

### 3. See It in Action

Once configured, turbo-charge your QA workflow by asking your AI assistant:

- *"List all projects in TestRail to find the latest active project."*
- *"Show me all active users in the project to find the right assignee."*
- *"Show me all test cases in section 5 of project 3."*
- *"Create a comprehensive test case for 'Login Validation' with detailed steps."*
- *"Start a new test run containing cases from section 5."*
- *"Mark test case ID 1042 as passed with the comment 'Tested successfully on staging'."*

---

## ⚙️ Environment Variables & Security Controls

| Variable | Description | Required | Default |
|----------|-------------|:--------:|:-------:|
| `TESTRAIL_INSTANCE_URL` | Your TestRail instance URL (e.g., `https://example.testrail.io`) | ✅ | |
| `TESTRAIL_USERNAME` | Your TestRail user email address | ✅ | |
| `TESTRAIL_API_KEY` | Your TestRail API key ([Guide](https://support.testrail.com/hc/en-us/articles/7077039051412-Accessing-the-TestRail-API)) | ✅ | |
| `TESTRAIL_ENABLE_SHARED_STEPS` | Set to `true` to enable Shared Steps management tools | | `false` |
| `TESTRAIL_ENABLE_CASE_HISTORY` | Set to `true` to enable Case History and revision tracking tools | | `false` |
| `TESTRAIL_ENABLE_RAG_TOOLS` | Set to `true` to enable experimental Knowledge Base / RAG export tools (`export_cases_for_rag`). Subject to breaking API changes. | | `false` |
| `TESTRAIL_ALLOW_WRITE_OPERATIONS` | Allow write operations (e.g. adding/updating test cases, test runs, sections) | | `true` |
| `TESTRAIL_ALLOW_READ_OPERATIONS` | Allow read operations (e.g. retrieving projects, test cases, templates) | | `true` |
| `TESTRAIL_ALLOW_DELETE_OPERATIONS` | Allow delete operations (e.g. deleting cases or shared steps). Enabled strictly via `true`. | | `false` |
| `TESTRAIL_ENABLE_DEPRECATED_TOOLS` | Enable deprecated tools for backward compatibility. Set to `false` to reduce context token overhead. | | `true` |
| `TESTRAIL_DISABLED_TOOLS` | Comma-separated list of specific tool names to disable (e.g., `mutate_suite,delete_entity`). Fails if invalid tool names are specified. | | - |

### ⚠️ Deprecation Lifecycle & Features Scheduled for Removal

To ensure smooth transitions, deprecated tools remain available by default (`TESTRAIL_ENABLE_DEPRECATED_TOOLS=true`) and will be removed in future major releases:

| Deprecated Tool | Replacement | Status |
|-----------------|-------------|--------|
| `add_attachment_to_run` | `add_attachment` (`entity_type: "case" \| "run"`) | Deprecated in `2.3.0`, scheduled for removal in `3.0.0` |
| `get_sections` | `query_section` (`action: "many"`) | Deprecated in `2.8.0`, scheduled for removal in `3.0.0` |

> **💡 Token Tip**: If you are not using legacy tools, set `TESTRAIL_ENABLE_DEPRECATED_TOOLS=false` in your environment to eliminate deprecated tool definitions from the LLM prompt and save tokens!

---

## 📚 Documentation & Complete Tool Reference

For a comprehensive guide, detailed configuration options, and a complete breakdown of all available tools, please visit our official documentation site:

**👉 [TestRail MCP Server Documentation](https://uarlouski.github.io/testrail-mcp-server/)**

The documentation includes detailed explanations for:
- 🔭 **Discovery & Navigation**: Exploring projects, suites, and sections.
- 📋 **Test Case Management**: Fetching, creating, and bulk-updating test cases.
- ▶️ **Execution & Tracking**: Managing test runs and submitting test results.
- 📎 **Attachments**: Automatically zipping and uploading files or directories.
- 🔗 **Shared Steps**: Managing reusable step definitions.


---

## 🤝 Contributing
Open-source contributions are actively welcomed! Please feel free to open an [issue](https://github.com/uarlouski/testrail-mcp-server/issues) for feature requests or submit a pull request for improvements.

## 📜 License
This project is securely licensed under the [Apache License 2.0](LICENSE).

---

<p align="center">
  <b>TestRail MCP Server</b> · Engineered with the <a href="https://modelcontextprotocol.io">Model Context Protocol</a>
</p>
