---
layout: home
title: TestRail MCP Server
description: Free, open-source Model Context Protocol server that connects Claude, Cursor, Windsurf, and VS Code to TestRail to manage test cases, runs, and results.

hero:
  name: "TestRail MCP Server"
  text: "Connect AI assistants to TestRail"
  tagline: A free, open-source Model Context Protocol (MCP) server that lets Claude, Cursor, Windsurf, and VS Code manage TestRail test cases, runs, and results conversationally — plus a CLI for CI/CD.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Browse all tools
      link: /reference/
    - theme: alt
      text: View on GitHub
      link: https://github.com/uarlouski/testrail-mcp-server

features:
  - title: 🔍 Discovery & Navigation
    details: Browse TestRail projects, test suites, and sections so your AI assistant can map your QA organization before it writes anything.
    link: /reference/discovery
    linkText: Discovery tools
  - title: 📋 Test Case Management
    details: Fetch, create, update, and bulk-edit test cases, with schema validation against your instance's custom fields.
    link: /reference/cases
    linkText: Case management tools
  - title: ▶️ Execution & Tracking
    details: Create test runs, submit results by test_id or case_id, and track pass/fail status straight from a chat message or a CI job.
    link: /reference/execution
    linkText: Execution tools
  - title: 🖥️ CLI & CI/CD Automation
    details: Call any tool from bash, GitHub Actions, GitLab CI, or Jenkins with testrail-cli — deterministic exit codes, JSON on stdout, zero LLM cost.
    link: /guide/cli
    linkText: CLI guide
  - title: 📎 Attachments & Media
    details: Attach screenshots, logs, or whole directories to cases, runs, and results. Directories are zipped automatically before upload.
    link: /reference/attachments
    linkText: Attachment tools
  - title: 🧠 System Metadata
    details: Expose statuses, priorities, templates, labels, and configurations so the model generates data that your TestRail instance actually accepts.
    link: /reference/metadata
    linkText: Metadata tools
  - title: 🔗 Shared Steps
    details: Create, update, and audit reusable shared test steps, with changes propagating to every linked test case.
    link: /reference/shared-steps
    linkText: Shared step tools
  - title: 🔐 Least-Privilege Controls
    details: Every tool declares a read, write, or delete mode. Deletes are off by default, and you can disable individual tools by name.
    link: /guide/configuration
    linkText: Configuration guide
---

<div class="custom-section">

## What is the TestRail MCP Server?

The **TestRail MCP Server** is an open-source [Model Context Protocol](https://modelcontextprotocol.io) server that gives AI assistants direct, structured access to a [TestRail](https://www.testrail.com/) instance through the TestRail API v2. Once it is configured, an assistant such as Claude Desktop, Cursor, Windsurf, or GitHub Copilot in VS Code can search test cases, draft new ones, start test runs, record results, and upload attachments on your behalf — without you leaving the chat window.

It is published on npm as [`@uarlouski/testrail-mcp-server`](https://www.npmjs.com/package/@uarlouski/testrail-mcp-server), runs on Node.js 18 or newer over the MCP stdio transport, and is licensed under Apache 2.0. The server is tested against **TestRail 10.6.2 (API v2)** and stays backward compatible with older instances, including pre-7.x pagination.

## Install it in one line

Point any MCP client at the package with `npx` and three environment variables:

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

There is nothing to build, host, or deploy. Full per-client instructions are in the [Getting Started guide](./guide/getting-started.md).

## Why use an MCP server for TestRail?

Maintaining test cases by hand is slow and error-prone: you copy requirements out of a ticket, retype them into TestRail's editor, guess at which custom fields are mandatory, and repeat it for every case. The TestRail MCP Server removes those steps.

- **No context switching.** Stay in your IDE or chat client instead of tabbing into the TestRail web UI.
- **No copy-pasting.** Ask for a set of cases, review them in chat, and push them to TestRail in the same breath.
- **Valid data on the first try.** The server reads your instance's templates, priorities, statuses, and custom field definitions and validates payloads before they are sent, so the model cannot invent a field that does not exist.
- **The same tools in CI.** Everything the AI can do, a shell script can do too — see the [CLI guide](./guide/cli.md).

Typical prompts that work out of the box:

> "List all active projects in TestRail." · "Show me every test case in section 5 of project 3." · "Write a comprehensive test case for login validation with detailed steps and add it to the Authentication section." · "Start a test run with the cases from section 5 and assign it to me." · "Mark test case C1042 as passed with the comment 'verified on staging'."

## What can it do?

The server exposes **34 MCP tools** across seven areas:

| Area | What your AI assistant can do | Tools |
| --- | --- | --- |
| Discovery | Browse projects, suites, sections, and users | [6 tools](./reference/discovery.md) |
| Test cases | Read, create, update, bulk-edit, and export cases | [9 tools](./reference/cases.md) |
| Execution | Create and update runs, read tests, submit results | [6 tools](./reference/execution.md) |
| Attachments | Upload and download files, auto-zip directories | [2 tools](./reference/attachments.md) |
| Shared steps | Read, create, update, and audit shared steps | [5 tools](./reference/shared-steps.md) |
| Metadata | Statuses, priorities, fields, templates, labels, configs | [6 tools](./reference/metadata.md) |
| Deletion | Remove cases, shared steps, and attachments | [1 tool](./reference/deletion.md) |

The [complete tool reference](./reference/) lists every tool with its permission mode and the feature flag that enables it.

## Is it safe to give an AI assistant access to TestRail?

That is the right question to ask, and the server is built around it. Access is layered rather than all-or-nothing:

1. **Per-mode toggles.** Every tool declares a `read`, `write`, or `delete` mode. Destructive delete tools are disabled unless you explicitly set `TESTRAIL_ALLOW_DELETE_OPERATIONS=true`.
2. **Per-tool allowlisting.** `TESTRAIL_DISABLED_TOOLS` removes named tools entirely, so you can permit `add_results_for_cases` while blocking `mutate_suite`.
3. **Opt-in features.** Shared steps, case history, and the experimental RAG export are off until you turn them on.
4. **Your own credentials.** The server runs locally and talks only to your TestRail instance using your API key. There is no third-party service in the middle.
5. **MCP annotations.** Read, write, and delete modes are surfaced to the client as `readOnlyHint` and `destructiveHint`, so clients that ask for confirmation can do so accurately.

Read the [Configuration guide](./guide/configuration.md) for the full permission matrix, or the [FAQ](./guide/faq.md) for shorter answers.

## Next steps

- **[Getting Started](./guide/getting-started.md)** — get a TestRail API key and configure your MCP client.
- **[Configuration](./guide/configuration.md)** — every environment variable, permission, and feature flag.
- **[Tool Reference](./reference/)** — all 34 tools, grouped by what they do.
- **[CLI & CI/CD](./guide/cli.md)** — run TestRail operations from pipelines without an LLM.
- **[FAQ](./guide/faq.md)** — short answers to common setup and security questions.

</div>

<style>
.custom-section {
  max-width: 1152px;
  margin: 48px auto;
  padding: 0 24px;
}
.custom-section h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 48px 0 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 8px;
}
.custom-section h2:first-child {
  margin-top: 0;
}
.custom-section blockquote {
  border-left: 4px solid var(--vp-c-brand-1);
  padding-left: 16px;
  margin: 16px 0;
  color: var(--vp-c-text-2);
}
</style>
