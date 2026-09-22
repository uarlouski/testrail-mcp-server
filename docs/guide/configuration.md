---
title: Configuration
description: Every TestRail MCP Server environment variable explained — credentials, read/write/delete permissions, feature flags, and per-tool allowlisting.
faq: true
---

# TestRail MCP Server configuration reference

The TestRail MCP Server is configured entirely through environment variables. There are **ten** of them: three credentials and seven that control which of the 34 tools get registered. This page documents all of them, then shows ready-made configurations for the most common setups.

Variables are validated with [Zod](https://zod.dev) when the server starts. Invalid values cause an immediate, descriptive failure rather than a confusing error later — see [validation behaviour](#what-happens-if-a-variable-is-invalid).

## Required credentials

| Variable | Description |
| --- | --- |
| `TESTRAIL_INSTANCE_URL` | Full instance URL including the scheme, for example `https://example.testrail.io`. Must parse as a valid URL. |
| `TESTRAIL_USERNAME` | The email address you sign in to TestRail with. Must be a valid email address. |
| `TESTRAIL_API_KEY` | An API key generated in TestRail under **My Settings → API Keys**. |

All three are mandatory. The server exits with a validation error if any is missing or malformed.

## Permission toggles

Each tool declares a mode of `read`, `write`, or `delete`. These three variables switch whole modes on or off, and the registry drops any tool whose mode is disabled.

| Variable | Default | Effect when enabled |
| --- | :---: | --- |
| `TESTRAIL_ALLOW_READ_OPERATIONS` | `true` | Registers the 22 read tools: fetching projects, cases, runs, results, metadata. |
| `TESTRAIL_ALLOW_WRITE_OPERATIONS` | `true` | Registers the 11 write tools: creating and updating cases, runs, sections, suites, results, attachments. |
| `TESTRAIL_ALLOW_DELETE_OPERATIONS` | `false` | Registers `delete_entity`, which permanently deletes cases, shared steps, and attachments. |

> [!WARNING]
> Deletion in TestRail is permanent and cannot be undone. `TESTRAIL_ALLOW_DELETE_OPERATIONS` is the only permission that is off by default, and it must be set to exactly the string `true` to take effect.

## Feature flags

Optional tool groups, all off by default to keep the model's prompt small.

| Variable | Default | Adds |
| --- | :---: | --- |
| `TESTRAIL_ENABLE_SHARED_STEPS` | `false` | The five [shared step tools](../reference/shared-steps.md). |
| `TESTRAIL_ENABLE_CASE_HISTORY` | `false` | `get_case_history`, for test case revisions and change diffs. |
| `TESTRAIL_ENABLE_RAG_TOOLS` | `false` | `export_cases_for_rag`. **Experimental** — the output format may change in any release. |

## Tool filtering

| Variable | Default | Effect |
| --- | :---: | --- |
| `TESTRAIL_ENABLE_DEPRECATED_TOOLS` | `true` | Preserved for backward compatibility with existing host configurations. No tool is currently deprecated, so this variable has no effect today. |
| `TESTRAIL_DISABLED_TOOLS` | — | Comma-separated tool names to remove entirely, for example `mutate_suite,delete_entity`. |

Any value other than the exact string `true` is treated as false for the boolean variables, so `1`, `yes`, and `TRUE` do **not** enable a feature.

## Common configurations

### Default: read and write, no deletes

The three credentials on their own give you 26 registered tools — everything except shared steps, case history, the RAG export, and `delete_entity`.

```json
{
  "env": {
    "TESTRAIL_INSTANCE_URL": "https://example.testrail.io",
    "TESTRAIL_USERNAME": "qa@example.com",
    "TESTRAIL_API_KEY": "your-api-key"
  }
}
```

### Strictly read-only

For exploratory work, audits, or letting an assistant answer questions about test coverage without any risk of modifying TestRail.

```json
{
  "env": {
    "TESTRAIL_INSTANCE_URL": "https://example.testrail.io",
    "TESTRAIL_USERNAME": "qa@example.com",
    "TESTRAIL_API_KEY": "your-api-key",
    "TESTRAIL_ALLOW_WRITE_OPERATIONS": "false"
  }
}
```

### Results-reporting bot

A CI agent that may report results but must never touch the test case library or the suite structure.

```json
{
  "env": {
    "TESTRAIL_INSTANCE_URL": "https://example.testrail.io",
    "TESTRAIL_USERNAME": "ci@example.com",
    "TESTRAIL_API_KEY": "your-api-key",
    "TESTRAIL_DISABLED_TOOLS": "add_case,update_case,update_cases,mutate_suite,mutate_section"
  }
}
```

### Everything on, including deletes

Full access. Appropriate for a trusted local workspace where you want the assistant to be able to clean up after itself.

```json
{
  "env": {
    "TESTRAIL_INSTANCE_URL": "https://example.testrail.io",
    "TESTRAIL_USERNAME": "qa@example.com",
    "TESTRAIL_API_KEY": "your-api-key",
    "TESTRAIL_ENABLE_SHARED_STEPS": "true",
    "TESTRAIL_ENABLE_CASE_HISTORY": "true",
    "TESTRAIL_ENABLE_RAG_TOOLS": "true",
    "TESTRAIL_ALLOW_DELETE_OPERATIONS": "true"
  }
}
```

## Disabling specific tools

`TESTRAIL_DISABLED_TOOLS` removes named tools from registration entirely, giving you finer control than the all-or-nothing mode toggles:

```bash
TESTRAIL_DISABLED_TOOLS=mutate_suite,mutate_section,query_attachment
```

There are four reasons to reach for it:

- **Token and context optimisation.** Every registered tool injects its full JSON schema and description into the model's system prompt. Removing tools you never call frees context window for the actual work.
- **Least privilege.** Mode toggles are coarse. This variable lets you permit routine writes such as `add_case` or `add_results_for_cases` while blocking structural changes such as `mutate_suite` and `mutate_section`.
- **Agent specialisation.** A narrower toolset keeps a specialised agent — a CI reporting bot, a read-only QA assistant — focused, and reduces wrong-tool invocations.
- **Fail-fast validation.** Misspelled names are caught at startup rather than silently ignored.

Tool names are listed in the [complete tool reference](../reference/).

## Using a `.env` file

The server loads [dotenv](https://github.com/motdotla/dotenv) at startup, so a `.env` file in the working directory is picked up automatically. This is convenient for local CLI use:

```bash
TESTRAIL_INSTANCE_URL=https://example.testrail.io
TESTRAIL_USERNAME=qa@example.com
TESTRAIL_API_KEY=your-api-key
```

Add `.env` to `.gitignore`. When the server is launched by an MCP client, the client's working directory is often not your project directory, so prefer the client's own `env` block for assistant setups.

## Frequently asked questions

### What happens if a variable is invalid?

The server validates the whole environment before it does anything else and exits with code `1`, printing a structured list of which variables failed and why. A URL without a scheme, a username that is not an email address, an empty API key, or an unknown name in `TESTRAIL_DISABLED_TOOLS` all fail at this point. This is deliberate: a misconfiguration surfaces at startup instead of as a confusing tool error mid-conversation.

### How do I give an AI assistant read-only access to TestRail?

Set `TESTRAIL_ALLOW_WRITE_OPERATIONS=false` and leave `TESTRAIL_ALLOW_DELETE_OPERATIONS` unset. Only the 22 read tools are registered, so no tool capable of changing TestRail data is ever offered to the model.

### Do I need to restart anything after changing configuration?

Yes. Environment variables are read once at startup, and MCP clients typically launch the server process when they start. Restart your MCP client completely after editing its configuration.

### Can different projects use different permissions?

Yes, by registering the server more than once. Give each entry a distinct name — `testrail-readonly` and `testrail-write`, for instance — with its own `env` block. Clients that support per-project configuration files, such as Cursor's `.cursor/mcp.json` and VS Code's `.vscode/mcp.json`, let you scope a configuration to a single repository.

### Which tools does each permission mode cover?

The [tool reference index](../reference/) lists every tool with its mode in a single table: 22 read, 11 write, and 1 delete.
