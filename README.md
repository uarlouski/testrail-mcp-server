<div align="center">
  <h1>🚀 TestRail MCP Server</h1>
  <p>
    <strong>A high-performance Model Context Protocol (MCP) server connecting AI assistants (Claude, Cursor, Windsurf) directly to TestRail.</strong><br>
    <em>Seamlessly search, create, update, and execute test cases using natural language.</em>
  </p>
</div>

<p align="center">
  <a href="https://www.npmjs.com/package/@uarlouski/testrail-mcp-server"><img src="https://badge.fury.io/js/@uarlouski%2Ftestrail-mcp-server.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@uarlouski/testrail-mcp-server"><img src="https://img.shields.io/npm/dm/@uarlouski/testrail-mcp-server.svg" alt="npm downloads"></a>
  <a href="https://github.com/uarlouski/testrail-mcp-server/actions/workflows/ci.yml"><img src="https://github.com/uarlouski/testrail-mcp-server/actions/workflows/ci.yml/badge.svg" alt="CI Status"></a>
  <a href="https://opensource.org/licenses/Apache-2.0"><img src="https://img.shields.io/badge/License-Apache_2.0-blue.svg" alt="License"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.9-blue.svg" alt="TypeScript"></a>
  <a href="https://github.com/uarlouski/testrail-mcp-server"><img src="https://img.shields.io/github/stars/uarlouski/testrail-mcp-server.svg?style=social&label=Star" alt="GitHub stars"></a>
</p>

---

## 🌟 Why Choose TestRail MCP Server?

Managing test cases manually is tedious and error-prone. With the **TestRail MCP Server**, your AI assistant (whether it’s **Claude, Cursor, Windsurf**, or any MCP-compliant client) interacts directly with your TestRail instance. Instruct it to find test cases, draft new ones, kick off test runs, and record test results—all through natural conversation.

**No context switching. No tedious copy-pasting. Just ask your AI.**

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

Add the server to your chosen MCP client configuration. Below are examples for popular AI IDEs and assistants:

<details>
<summary><strong>🤖 Claude Desktop</strong></summary>

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
</details>

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
- *"Show me all test cases in section 5 of project 3."*
- *"Create a comprehensive test case for 'Login Validation' with detailed steps."*
- *"Start a new test run containing cases from section 5."*
- *"Mark test case ID 1042 as passed with the comment 'Tested successfully on staging'."*

---

## ⚙️ Environment Variables

| Variable | Description | Required |
|----------|-------------|:--------:|
| `TESTRAIL_INSTANCE_URL` | Your TestRail instance URL (e.g., `https://example.testrail.io`) | ✅ |
| `TESTRAIL_USERNAME` | Your TestRail user email address | ✅ |
| `TESTRAIL_API_KEY` | Your TestRail API key ([Guide](https://support.testrail.com/hc/en-us/articles/7077039051412-Accessing-the-TestRail-API)) | ✅ |

---

## 🛠️ Complete Tool Reference

The TestRail MCP Server provides heavily typed, descriptive tools designed specifically for LLM interaction:

### 🔭 Discovery & Navigation
| Tool | Functionality |
|------|-------------|
| `get_projects` | List all available active and completed projects in your instance. |
| `get_sections` | Navigate the precise folder/section hierarchy of any test suite. |

### 📋 Test Case Management
| Tool | Functionality |
|------|-------------|
| `get_cases` | Query test cases with advanced filtering (priority, template, type, etc.) and pagination. |
| `get_case` | Fetch complete, structured details of a specific test case, including custom steps and fields. |
| `create_case` | Seamlessly create a new test case equipped with robust custom field validation. |
| `update_case` | Modify an existing test case's steps, metadata, or titles. |
| `update_cases` | Execute bulk-updates on multiple test cases simultaneously to save time. |

### ▶️ Test Execution & Tracking
| Tool | Functionality |
|------|-------------|
| `add_run` | Generate a new, focused test run directly in TestRail. |
| `get_tests` | Retrieve individual tests for a specific test run, with optional status filtering. |
| `add_results` | Submit test results to a test run using the specific `test_id`. |
| `add_results_for_cases` | Submits results to a run mapping directly to `case_id`s, streamlining automation workflows. |
| `add_attachment_to_run` | Attach logs, files, or zipped artifacts directly to an ongoing test run. |

### 🧠 System Metadata
| Tool | Functionality |
|------|-------------|
| `get_statuses` | Systematically list all configured test statuses (Passed, Failed, Blocked, Retest, etc.). |
| `get_priorities` | Retrieve priority levels configured within your instance structure. |
| `get_case_fields` | Discover custom field definitions, formats, and UI dropdown options. |
| `get_templates` | Identify available case templates to mandate correct AI structuring. |

---

## 🤝 Contributing
Open-source contributions are actively welcomed! Please feel free to open an [issue](https://github.com/uarlouski/testrail-mcp-server/issues) for feature requests or submit a pull request for improvements.

## 📜 License
This project is securely licensed under the [Apache License 2.0](LICENSE).

---

<p align="center">
  <b>TestRail MCP Server</b> · Engineered with the <a href="https://modelcontextprotocol.io">Model Context Protocol</a>
</p>

<!-- SEO Keywords -->
<div align="center">
  <p>
    <small>
      <b>Keywords:</b> TestRail MCP Server, Model Context Protocol, TestRail API Integration, AI Test Management, LLM Testing Tools, Claude TestRail Plugin, Cursor TestRail, Windsurf QA Tool, Test Case Automation, QA AI Assistant, MCP Server Developer Tools, Prompt Engineering TestRail, Test Run Tracking, QA Productivity Automation.
    </small>
  </p>
</div>
