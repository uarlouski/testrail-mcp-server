# TestRail MCP Server

[![npm version](https://img.shields.io/npm/v/@uarlouski/testrail-mcp-server.svg)](https://www.npmjs.com/package/@uarlouski/testrail-mcp-server)
[![License](https://img.shields.io/npm/l/@uarlouski/testrail-mcp-server.svg)](https://github.com/uarlouski/testrail-mcp-server/blob/main/LICENSE)

A powerful **Model Context Protocol (MCP)** server for seamless integration between **Large Language Models (LLMs)** and **TestRail** test case management.

This MCP server enables AI assistants like **Claude**, **Cursor**, **Windsurf**, and other MCP-compliant clients to interact directly with your TestRail instance. Streamline your QA workflows by allowing your AI to search, retrieve, create, and update test cases, plans, and runs.

## 🚀 Features

- **AI-Powered Test Management**: Bridge the gap between AI and your QA process.
- **Smart Discovery**: List projects, suites, and sections to help LLMs understand your test organization.
- **Comprehensive Case Operations**: Fetch, create, and update test cases with full support for custom fields.
- **Context-Aware**: Designed to provide LLMs with the right context (templates, field options) for accurate test generation.

## ⚙️ Usage

Configure the server in your MCP client settings (e.g., `claude_desktop_config.json` or Cursor settings).

### Claude Desktop / General MCP Clients

Add the following to your configuration file:

```json
{
  "mcpServers": {
    "testrail": {
      "command": "npx",
      "args": [
        "-y",
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

### Environment Variables

| Variable | Description | Required |
|----------|-------------|:--------:|
| `TESTRAIL_INSTANCE_URL` | The URL of your TestRail instance (e.g., `https://example.testrail.io`) | Yes |
| `TESTRAIL_USERNAME` | Your TestRail email address | Yes |
| `TESTRAIL_API_KEY` | Your TestRail API key (generate in My Settings > API Keys) | Yes |

## 🛠️ Available Tools

This MCP server exposes the following tools to the LLM:

| Tool | Description |
|------|-------------|
| `get_projects` | **Discovery**: List all available projects in the TestRail instance to establish context. |
| `get_suites` | **Discovery**: Retrieve test suites for a given project (if not in single-suite mode). |
| `get_sections` | **Structure**: navigate the folder/section hierarchy of a test suite. |
| `get_cases` | **Search**: Query test cases with filtering (priority, template, type, etc.) and pagination. |
| `get_case` | **Detail**: Fetch comprehensive details of a specific test case, including steps and custom fields. |
| `create_case` | **Authoring**: Create new test cases. *Tip: The model should check templates and fields first to ensure validity.* |
| `update_case` | **Maintenance**: Modify existing test case fields, title, or steps. |
| `update_cases` | **Bulk Edit**: Update multiple cases simultaneously for efficient refactoring. |
| `add_run` | **Test Execution**: Create a new test run in TestRail. |
| `get_tests` | **Test Execution**: Get tests for a test run, optionally filtered by status. |
| `add_results` | **Test Execution**: Add one or more test results to a test run. |
| `get_statuses` | **Metadata**: Get all available test statuses (e.g. Passed, Failed, Blocked). |
| `get_case_fields` | **Metadata**: Retrieve definitions of custom fields to understand available inputs. |
| `get_templates` | **Metadata**: List available case templates to ensure correct case creation structure. |
| `get_priorities` | **Metadata**: List available priority levels. |
| `get_case_types` | **Metadata**: List available case types (e.g., Automated, Manual). |

## 📜 License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

---

*Keywords: TestRail, MCP, Model Context Protocol, LLM, AI, Claude, Cursor, Windsurf, Test Management, QA, Automation, Testing, API*
