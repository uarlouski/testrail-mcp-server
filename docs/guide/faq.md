---
title: FAQ
description: Answers about the TestRail MCP Server — supported AI assistants and TestRail versions, permissions, security, pricing, and setup troubleshooting.
faq: true
---

# TestRail MCP Server FAQ

Short, direct answers to the questions people ask most often about the TestRail MCP Server. For step-by-step setup, see [Getting Started](./getting-started.md); for every setting, see [Configuration](./configuration.md).

## General

### What is the TestRail MCP Server?

The TestRail MCP Server is a free, open-source [Model Context Protocol](https://modelcontextprotocol.io) server that connects AI assistants to a TestRail instance through the TestRail API v2. It gives an assistant 34 tools for browsing projects and suites, reading and writing test cases, creating test runs, submitting results, and uploading attachments. It is published on npm as `@uarlouski/testrail-mcp-server` and licensed under Apache 2.0.

### What is the Model Context Protocol?

The Model Context Protocol (MCP) is an open standard that defines how AI assistants discover and call external tools. An MCP server advertises a set of tools with typed schemas; an MCP client, such as Claude Desktop or Cursor, presents those tools to the model and executes the calls the model requests. Because the protocol is standardised, one TestRail MCP Server works with every compliant client.

### Which AI assistants and MCP clients are supported?

Any MCP-compliant client works, because the server speaks the standard MCP stdio transport. Setup has been verified with Claude Desktop, Cursor, Windsurf, and VS Code. Other clients follow the same pattern: run `npx -y @uarlouski/testrail-mcp-server@latest` and supply three environment variables.

### Is the TestRail MCP Server free?

Yes. It is open source under the Apache 2.0 licence, with no paid tier, licence key, or usage limit. You need your own TestRail subscription and, if you use an AI assistant, whatever that assistant costs. The [CLI](./cli.md) has no LLM cost at all.

### Who maintains it?

It is maintained by [Uladzislau Arlouski](https://github.com/uarlouski) on GitHub. Bug reports and pull requests are welcome in the [issue tracker](https://github.com/uarlouski/testrail-mcp-server/issues).

## Requirements and compatibility

### Which TestRail versions are supported?

The server targets TestRail API v2 and is tested against **TestRail 10.6.2**. Older instances also work: the client detects whether an endpoint returns a modern paginated response or a legacy bare array, so pre-7.x instances are handled without configuration. Both TestRail Cloud and TestRail Server (self-hosted) are supported, as long as the instance is reachable from the machine running the server.

### What do I need installed?

Node.js 18 or newer, and nothing else. The server is distributed on npm and run through `npx`, so there is no separate install, build, or hosting step. You do need a TestRail account with an API key.

### How do I get a TestRail API key?

In TestRail, open **My Settings**, switch to the **API Keys** tab, and generate a new key. Copy it immediately — TestRail shows the key only once. Note that the API must also be enabled instance-wide under **Administration → Site Settings → API**, which requires an administrator.

### Does it work with a self-hosted TestRail behind a VPN?

Yes. The server runs locally on your machine and connects outward to whatever URL you put in `TESTRAIL_INSTANCE_URL`, so it inherits your machine's network access. If your laptop can reach the instance, so can the server.

## Security and permissions

### Is it safe to give an AI assistant write access to TestRail?

Access is layered so that you can grant only what you need. Every tool declares a mode of `read`, `write`, or `delete`. Delete operations are disabled unless you explicitly set `TESTRAIL_ALLOW_DELETE_OPERATIONS=true`. You can turn off all writes with `TESTRAIL_ALLOW_WRITE_OPERATIONS=false`, or block individual tools by name with `TESTRAIL_DISABLED_TOOLS`. A common setup for exploratory work is read-only; a common setup for reporting bots is writes limited to `add_results_for_cases`.

### Can the server delete my test cases?

Not by default. The single delete tool, `delete_entity`, is not registered unless `TESTRAIL_ALLOW_DELETE_OPERATIONS=true` is set. Even then you can exclude it with `TESTRAIL_DISABLED_TOOLS=delete_entity`. Deletions in TestRail are permanent and cannot be undone, which is why the tool is opt-in.

### Does the server send my data to any third party?

No. The server runs as a local process and makes HTTP requests to exactly one host: the TestRail instance URL you configure. There is no telemetry, analytics, or phone-home behaviour in the codebase. Your test data does travel to whichever AI assistant you connect, because that is how the assistant reads it — that flow is governed by your AI provider's terms, not by this server.

### Where is my API key stored?

Wherever your MCP client keeps its configuration, for example `claude_desktop_config.json` for Claude Desktop. The server itself reads the key from its environment and never writes it to disk or logs. Treat the client config file as a secret and keep it out of version control.

### How do I set up a read-only configuration?

Set `TESTRAIL_ALLOW_WRITE_OPERATIONS=false` and leave `TESTRAIL_ALLOW_DELETE_OPERATIONS` unset. That leaves the 22 read tools registered and removes every tool that can change TestRail data.

## Usage

### What can I actually ask the AI to do?

Anything the 34 tools cover. Realistic examples: "list the active projects", "show every case in section 5 of project 3", "write a test case for password reset with detailed steps and add it to the Authentication section", "create a test run from the cases in section 5 and assign it to me", "mark C1042 as passed with a comment", "attach this screenshot folder to run 88". Browse the [tool reference](../reference/) to see the full surface.

### How does it avoid inventing custom fields that do not exist?

Before an `add_case` or `update_case` request is sent, the server validates every field key against the instance's real schema, fetched through `get_case_fields`, and rejects unknown keys. It also exposes `get_templates`, `get_priorities`, `get_statuses`, and `get_configurations` so the model can look up the correct numeric IDs instead of guessing them. See [System Metadata](../reference/metadata.md).

### What happens with very large result sets?

Tools that can return a lot of data — `get_cases`, `get_case_history`, `query_section`, `query_attachment` — accept an `output_file` parameter. When you supply one, the server writes the full JSON to disk and returns only a brief summary to the model, so a query over thousands of cases does not exhaust the context window. Pagination is handled automatically in all cases.

### Can I use it in CI/CD without an AI assistant?

Yes, and this is a first-class use case. The package ships a `testrail-cli` binary that exposes every tool as a subcommand, reusing the same API client, retry logic, and validation schemas. It prints JSON to stdout, diagnostics to stderr, and exits `0` or `1`, so it drops straight into GitHub Actions, GitLab CI, or Jenkins. See the [CLI and CI/CD guide](./cli.md).

### Why is one tool handling several operations?

Several tools use a discriminated union on an `action` field, so `query_project` covers both "fetch one" and "list all", and `mutate_run` covers both create and update. Fewer tool definitions means fewer tokens in the model's system prompt and less opportunity for the model to choose the wrong tool.

### How do I reduce the token cost of the tool definitions?

Three settings help. Set `TESTRAIL_ENABLE_DEPRECATED_TOOLS=false` to drop the two legacy tools. Use `TESTRAIL_DISABLED_TOOLS` to remove tools you never call. Leave optional features such as shared steps and case history off unless you use them. Each removed tool takes its whole JSON schema out of the prompt.

### Can it export TestRail cases into a RAG or knowledge base pipeline?

Yes, through the experimental `export_cases_for_rag` tool, enabled with `TESTRAIL_ENABLE_RAG_TOOLS=true`. It writes each case as a Markdown document with a companion `.md.metadata.json` sidecar containing filterable attributes, including the case's `updated_on` timestamp so ingestion pipelines can sync incrementally and evict stale embeddings. The tool is under active design and its output format may change between releases. See [Test Case Management](../reference/cases.md#export-cases-for-rag).

## Troubleshooting

### Why does the server fail to start with a configuration error?

The three required variables — `TESTRAIL_INSTANCE_URL`, `TESTRAIL_USERNAME`, and `TESTRAIL_API_KEY` — are validated on startup. The URL must be a full URL including the scheme, such as `https://example.testrail.io` rather than `example.testrail.io`, and the username must be the email address you sign in with, not a display name. The server also fails fast if `TESTRAIL_DISABLED_TOOLS` contains a name that does not match a real tool, and the error message lists the offending names.

### Why does my AI assistant not show any TestRail tools?

Restart the client completely after editing its configuration file, since most MCP clients read it only at launch. Then confirm the JSON is valid, check that `npx` is on the `PATH` in the environment the client launches, and look at the client's MCP logs for the server's stderr output. If reads and writes are both disabled, no tools will be registered at all.

### Why do I get an error saying `suite_id` is required?

The project uses multiple test suites or baselines (`suite_mode` 2 or 3), so TestRail cannot infer which suite you mean. Pass `suite_id` explicitly. Use `query_suite` with `action: "many"` to list the suites in the project and find the right ID.

### Why does `get_users` return a permissions error?

Listing all users in TestRail requires administrator rights. The server detects that rejection and falls back to collecting users from each active project instead, deduplicating the results, so assignee lookups keep working for non-admin accounts. If you still see an error, the account may lack access to any project.

### How does the server handle TestRail rate limits and 5xx errors?

These are retried automatically. The client retries network failures, `429` responses, and `500`, `502`, `503`, and `504` responses up to three times with exponential backoff, honouring the `Retry-After` header when TestRail sends one. Persistent failures usually mean the instance is genuinely unavailable or the API is disabled instance-wide.
