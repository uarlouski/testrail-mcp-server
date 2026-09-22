<div align="center">
  <h1>🚀 TestRail MCP Server</h1>
  <p>
    <strong>Connect Claude, Cursor, Windsurf, and VS Code to TestRail — an open-source Model Context Protocol (MCP) server for AI-assisted test management.</strong>
  </p>
  <p>
    Manage TestRail projects, search and create test cases, kick off test runs, record results, and attach files through natural-language conversation with your AI assistant — or from CI/CD with the bundled <code>testrail-cli</code>. Built for QA engineers and AI-assisted test automation.
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
  <a href="https://m8ven.ai/mcp/uarlouski/testrail-mcp-server"><img src="https://m8ven.ai/badge/mcp/uarlouski/testrail-mcp-server" alt="M8ven Score"></a>
</p>

<p align="center">
  <strong>Compatible with:</strong>
  <img src="https://img.shields.io/badge/Claude%20Desktop-D97757?logo=anthropic&logoColor=white" alt="Claude Desktop">
  <img src="https://img.shields.io/badge/Cursor-000000?logo=cursor&logoColor=white" alt="Cursor">
  <img src="https://img.shields.io/badge/Windsurf-19A1BC?logo=codeium&logoColor=white" alt="Windsurf">
  <img src="https://img.shields.io/badge/VS%20Code-007ACC?logo=visualstudiocode&logoColor=white" alt="VS Code">
</p>

<p align="center">
  <a href="https://uarlouski.github.io/testrail-mcp-server/"><strong>📚 Documentation</strong></a> ·
  <a href="https://uarlouski.github.io/testrail-mcp-server/guide/getting-started"><strong>Getting Started</strong></a> ·
  <a href="https://uarlouski.github.io/testrail-mcp-server/reference/"><strong>Tool Reference</strong></a> ·
  <a href="https://uarlouski.github.io/testrail-mcp-server/guide/faq"><strong>FAQ</strong></a>
</p>

<!-- TODO: insert demo.gif — short screencast of asking "create a test case" in Claude or Cursor and seeing the case appear in TestRail -->

---

## What is the TestRail MCP Server?

The **TestRail MCP Server** is a free, open-source [Model Context Protocol](https://modelcontextprotocol.io) server that gives AI assistants direct, structured access to a [TestRail](https://www.testrail.com/) instance through the TestRail API v2. Once configured, an assistant such as **Claude Desktop, Cursor, Windsurf, or GitHub Copilot in VS Code** can search test cases, draft new ones, start test runs, record results, and upload attachments on your behalf — without you leaving the chat window.

It exposes **34 tools**, runs locally on **Node.js 18+** over the MCP stdio transport, and is licensed under **Apache 2.0**. There is nothing to host or deploy: your MCP client launches it on demand with `npx`.

**No context switching. No tedious copy-pasting. Just ask your AI.**

> [!NOTE]
> **Compatibility baseline**: tested and validated against **TestRail 10.6.2** (API v2). Older TestRail instances (including pre-7.x pagination) are also supported via built-in backward compatibility. TestRail Cloud and self-hosted TestRail Server both work.

## Table of contents

- [Key features](#-key-features--capabilities)
- [Quick start](#-quick-start-guide)
- [Command line interface & CI/CD](#️-command-line-interface-cli--cicd-automation)
- [Environment variables](#️-environment-variables--security-controls)
- [Available tools](#-available-tools)
- [FAQ](#-frequently-asked-questions)
- [Documentation](#-documentation--complete-tool-reference)
- [Contributing](#-contributing)

## ✨ Key Features & Capabilities

| Capability | Description |
|------------|-------------|
| **🔍 Intelligent Discovery** | Browse projects, test suites, and sections to automatically map your QA organization. |
| **📋 Full Case Management** | Fetch, create, update, and bulk-edit test cases with comprehensive custom field support. |
| **▶️ Actionable Execution** | Create test runs, update results by `test_id` or `case_id`, attach files, and track statuses. |
| **🧠 Context-Aware AI** | Dynamically exposes templates, fields, priorities, and statuses so LLMs generate valid, structured data. |
| **🖥️ CLI & CI/CD Native** | Run every tool from bash, GitHub Actions, GitLab CI, or Jenkins with zero LLM overhead. |
| **🔐 Least-Privilege Controls** | Per-mode permissions plus per-tool allowlisting; destructive deletes are off by default. |

## 🚀 Quick Start Guide

### 1. Obtain your TestRail API key

Navigate to **My Settings → API Keys** in TestRail and generate a new key. Copy it immediately — TestRail shows it only once. The API must also be enabled instance-wide under **Administration → Site Settings → API**.

### 2. Configure your MCP client

Add the server to your MCP client configuration. The Claude Desktop example is shown below; Cursor, Windsurf, and VS Code use the same pattern (see the collapsible sections).

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

Open **Settings → MCP → Add new MCP server**, or edit `.cursor/mcp.json` in your project (`~/.cursor/mcp.json` for all projects):

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

Edit `~/.codeium/windsurf/mcp_config.json`:

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
<summary><strong>💻 VS Code</strong></summary>

Add to `.vscode/mcp.json`. The `inputs` block keeps your API key out of the file:

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
</details>

<details>
<summary><strong>🌐 Other MCP Clients</strong></summary>

Any MCP-compliant client can use this server, because it speaks the standard MCP **stdio** transport. Point your client at the `npx` command with the required environment variables — no port, URL, or transport configuration needed.
</details>

### 3. See it in action

Restart your client completely, then turbo-charge your QA workflow by asking your AI assistant:

- *"List all projects in TestRail to find the latest active project."*
- *"Show me all active users in the project to find the right assignee."*
- *"Show me all test cases in section 5 of project 3."*
- *"Create a comprehensive test case for 'Login Validation' with detailed steps."*
- *"Start a new test run containing cases from section 5."*
- *"Mark test case C1042 as passed with the comment 'verified on staging'."*

Full per-client setup instructions, including troubleshooting, are in the [Getting Started guide](https://uarlouski.github.io/testrail-mcp-server/guide/getting-started).

---

## 🖥️ Command Line Interface (CLI) & CI/CD Automation

In addition to interacting via AI assistants, you can invoke any TestRail tool directly from shell scripts, terminal environments, and automated CI/CD pipelines (GitHub Actions, GitLab CI, Jenkins) using **`testrail-cli`** or **`npx`** — with zero LLM overhead.

- **Deterministic Execution**: Returns standard Unix exit codes (`0` on success, `1` on error).
- **Pipeline-Native Output**: Emits clean JSON to `stdout` for piping into tools like `jq`, while diagnostics and errors go to `stderr`.
- **Zero Duplication**: Reuses the exact same API client, retry logic, and validation schemas as the MCP server.

### Invocation methods

```bash
# Method 1: Direct npx subcommand (Recommended)
npx @uarlouski/testrail-mcp-server cli <command> [flags]

# Method 2: Global or local binary
testrail-cli <command> [flags]

# Method 3: Via package runner
npx -p @uarlouski/testrail-mcp-server testrail-cli <command> [flags]
```

### Examples

#### Query projects (`query_project`)
```bash
# List all active projects
npx @uarlouski/testrail-mcp-server cli query_project --action many

# Query a single project by ID
npx @uarlouski/testrail-mcp-server cli query_project --action one --project_id 1
```

#### Report automated test results (`add_results_for_cases`)
```bash
# Submit results by case_id — what your test framework already knows
npx @uarlouski/testrail-mcp-server cli add_results_for_cases \
  --run_id 88 \
  --results '[{"case_id":1042,"status_id":1,"comment":"Passed in CI"}]'
```

#### Export cases for knowledge base / RAG (`export_cases_for_rag`)
```bash
# Export all cases for a project into Markdown & metadata sidecars
npx @uarlouski/testrail-mcp-server cli export_cases_for_rag \
  --project_id 1 \
  --output_dir ./rag_exports

# Export specific cases by ID (comma-separated list)
npx @uarlouski/testrail-mcp-server cli export_cases_for_rag \
  --case_ids C101,C102,103 \
  --output_dir ./rag_exports
```

#### Command discovery & flag documentation
```bash
# List all available commands
npx @uarlouski/testrail-mcp-server cli --help

# Show parameter options for a specific tool
npx @uarlouski/testrail-mcp-server cli query_project --help
```

See the [CLI & CI/CD guide](https://uarlouski.github.io/testrail-mcp-server/guide/cli) for complete GitHub Actions, GitLab CI, and Jenkins workflows.

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
| `TESTRAIL_ENABLE_DEPRECATED_TOOLS` | Preserved for backward compatibility with existing host configurations. | | `true` |
| `TESTRAIL_DISABLED_TOOLS` | Comma-separated list of specific tool names to disable (e.g., `mutate_suite,delete_entity`). Fails if invalid tool names are specified. | | - |

With only the three required credentials, **26 of the 34 tools** are registered. Ready-made read-only and least-privilege configurations are in the [Configuration guide](https://uarlouski.github.io/testrail-mcp-server/guide/configuration).

---

## 🧰 Available Tools

All 34 tools, grouped by area. Each declares a `read`, `write`, or `delete` mode, which the server surfaces to clients as MCP annotations (`readOnlyHint`, `destructiveHint`, `idempotentHint`).

| Area | Tools | Reference |
|------|-------|-----------|
| **Discovery & Navigation** | `query_project`, `query_suite`, `mutate_suite`, `query_section`, `mutate_section`, `get_users` | [Docs](https://uarlouski.github.io/testrail-mcp-server/reference/discovery) |
| **Test Case Management** | `get_case`, `get_cases`, `add_case`, `update_case`, `update_cases`, `get_case_fields`, `resolve_case_field`, `get_case_history`, `export_cases_for_rag` | [Docs](https://uarlouski.github.io/testrail-mcp-server/reference/cases) |
| **Execution & Tracking** | `query_run`, `mutate_run`, `get_tests`, `get_results`, `add_results`, `add_results_for_cases` | [Docs](https://uarlouski.github.io/testrail-mcp-server/reference/execution) |
| **Attachments & Media** | `add_attachment`, `query_attachment` | [Docs](https://uarlouski.github.io/testrail-mcp-server/reference/attachments) |
| **Shared Steps** | `get_shared_step`, `get_shared_steps`, `get_shared_step_history`, `add_shared_step`, `update_shared_step` | [Docs](https://uarlouski.github.io/testrail-mcp-server/reference/shared-steps) |
| **System Metadata** | `get_statuses`, `get_priorities`, `get_case_fields`, `get_templates`, `get_labels`, `get_configurations` | [Docs](https://uarlouski.github.io/testrail-mcp-server/reference/metadata) |
| **Deletion** | `delete_entity` | [Docs](https://uarlouski.github.io/testrail-mcp-server/reference/deletion) |

---

## ❓ Frequently Asked Questions

<details>
<summary><strong>Which AI assistants and MCP clients are supported?</strong></summary>

Any MCP-compliant client, because the server uses the standard MCP stdio transport. Setup is verified with Claude Desktop, Cursor, Windsurf, and VS Code. Other clients follow the same pattern: run `npx -y @uarlouski/testrail-mcp-server@latest` with three environment variables.
</details>

<details>
<summary><strong>Which TestRail versions are supported?</strong></summary>

The server targets TestRail API v2 and is tested against **TestRail 10.6.2**. Older instances work too — the client detects whether an endpoint returns a modern paginated response or a legacy bare array, so pre-7.x instances need no configuration. Both TestRail Cloud and self-hosted TestRail Server are supported.
</details>

<details>
<summary><strong>Is it safe to give an AI assistant write access to TestRail?</strong></summary>

Access is layered rather than all-or-nothing. Every tool declares a `read`, `write`, or `delete` mode; deletes are disabled unless you explicitly set `TESTRAIL_ALLOW_DELETE_OPERATIONS=true`. You can disable all writes with `TESTRAIL_ALLOW_WRITE_OPERATIONS=false`, or block individual tools by name with `TESTRAIL_DISABLED_TOOLS`. The server runs locally and talks only to your TestRail instance — there is no telemetry and no third-party service in the middle.
</details>

<details>
<summary><strong>Is it free?</strong></summary>

Yes — Apache 2.0 licensed, with no paid tier, licence key, or usage limit. You need your own TestRail subscription, and whatever your AI assistant costs. The CLI has no LLM cost at all.
</details>

<details>
<summary><strong>Can I use it in CI/CD without an AI assistant?</strong></summary>

Yes. The package ships a `testrail-cli` binary exposing every tool as a subcommand, reusing the same API client, retry logic, and validation schemas. JSON on stdout, diagnostics on stderr, exit code `0` or `1` — see the [CLI guide](https://uarlouski.github.io/testrail-mcp-server/guide/cli).
</details>

<details>
<summary><strong>How do I stop the AI from inventing custom fields that don't exist?</strong></summary>

It can't. Before `add_case` or `update_case` sends anything, the server validates every field key against your instance's real schema (fetched via `get_case_fields`) and rejects unknown keys. Templates, priorities, statuses, and configurations are all exposed as tools too, so the model looks up correct IDs instead of guessing them.
</details>

<details>
<summary><strong>How do I handle thousands of test cases without blowing the context window?</strong></summary>

Pass `output_file` to `get_cases` (or `output_dir` to `export_cases_for_rag`). The server paginates the full result set, writes raw JSON to disk, and returns only a short summary to the model.
</details>

More answers in the [full FAQ](https://uarlouski.github.io/testrail-mcp-server/guide/faq).

---

## 📚 Documentation & Complete Tool Reference

For a comprehensive guide, detailed configuration options, and a complete breakdown of all available tools, visit the official documentation site:

**👉 [TestRail MCP Server Documentation](https://uarlouski.github.io/testrail-mcp-server/)**

- 🚀 **[Getting Started](https://uarlouski.github.io/testrail-mcp-server/guide/getting-started)**: Per-client setup for Claude, Cursor, Windsurf, and VS Code.
- ⚙️ **[Configuration](https://uarlouski.github.io/testrail-mcp-server/guide/configuration)**: Every environment variable, permission, and feature flag.
- 🧰 **[All Tools](https://uarlouski.github.io/testrail-mcp-server/reference/)**: All 34 tools with modes and feature flags in one table.
- 🔭 **[Discovery & Navigation](https://uarlouski.github.io/testrail-mcp-server/reference/discovery)**: Exploring projects, suites, and sections.
- 📋 **[Test Case Management](https://uarlouski.github.io/testrail-mcp-server/reference/cases)**: Fetching, creating, and bulk-updating test cases.
- ▶️ **[Execution & Tracking](https://uarlouski.github.io/testrail-mcp-server/reference/execution)**: Managing test runs and submitting test results.
- 📎 **[Attachments](https://uarlouski.github.io/testrail-mcp-server/reference/attachments)**: Automatically zipping and uploading files or directories.
- 🔗 **[Shared Steps](https://uarlouski.github.io/testrail-mcp-server/reference/shared-steps)**: Managing reusable step definitions.
- 🖥️ **[CLI & CI/CD](https://uarlouski.github.io/testrail-mcp-server/guide/cli)**: Pipeline automation without an LLM.

---

## 🤝 Contributing

Open-source contributions are actively welcomed! Please feel free to open an [issue](https://github.com/uarlouski/testrail-mcp-server/issues) for feature requests or submit a pull request for improvements.

## 📜 License

This project is licensed under the [Apache License 2.0](LICENSE).

---

<p align="center">
  <b>TestRail MCP Server</b> · Engineered with the <a href="https://modelcontextprotocol.io">Model Context Protocol</a>
</p>
