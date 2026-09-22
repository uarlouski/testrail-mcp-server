---
title: All TestRail MCP Tools
description: Complete reference of all 36 TestRail MCP Server tools, with each tool's permission mode and the environment variable that enables it.
faq: true
---

# TestRail MCP Server tool reference

The TestRail MCP Server exposes **34 tools** to any connected MCP client. This page lists every one of them in a single table, along with its permission mode and the environment variable that enables it. Follow the group links for parameter-level detail and worked examples.

Every tool declares one of three modes, which the server translates into MCP annotations (`readOnlyHint`, `destructiveHint`, `idempotentHint`) so that clients can prompt for confirmation appropriately:

| Mode | Count | Enabled by default? | Controlled by |
| --- | --- | --- | --- |
| `read` | 22 | Yes | `TESTRAIL_ALLOW_READ_OPERATIONS` |
| `write` | 11 | Yes | `TESTRAIL_ALLOW_WRITE_OPERATIONS` |
| `delete` | 1 | **No** | `TESTRAIL_ALLOW_DELETE_OPERATIONS` |

With default settings, 26 of the 34 tools are registered. The remaining eight sit behind feature flags (five shared step tools, `get_case_history`, `export_cases_for_rag`) or the delete permission (`delete_entity`) — see the [Configuration guide](../guide/configuration.md).

## Discovery & navigation

Map the TestRail hierarchy before reading or writing anything. [Full details →](./discovery.md)

| Tool | Mode | What it does |
| --- | --- | --- |
| `query_project` | `read` | Fetch one project by ID, or list all active projects |
| `query_suite` | `read` | Fetch one test suite by ID, or list all suites in a project |
| `mutate_suite` | `write` | Create or update a test suite |
| `query_section` | `read` | Fetch one section (optionally as a nested tree), or list sections with regex filtering |
| `mutate_section` | `write` | Create or update a section, including nested sections via `parent_id` |
| `get_users` | `read` | List active users, optionally scoped to a project |

## Test case management

Read, write, and bulk-edit test cases. [Full details →](./cases.md)

| Tool | Mode | What it does |
| --- | --- | --- |
| `get_case` | `read` | Fetch a single case with custom fields and steps resolved to readable values |
| `get_cases` | `read` | List cases by project or section, with recursion, projection, filtering, and file export |
| `add_case` | `write` | Create a case in a section, validating fields against the instance schema first |
| `update_case` | `write` | Partially update a single case |
| `update_cases` | `write` | Apply the same field changes to many cases at once |
| `get_case_fields` | `read` | Discover custom field definitions, types, and dropdown options |
| `resolve_case_field` | `read` | Translate multi-select reference IDs into human-readable labels |
| `get_case_history` | `read` | Revision history and change diffs — requires `TESTRAIL_ENABLE_CASE_HISTORY=true` |
| `export_cases_for_rag` | `read` | Export cases as Markdown plus metadata sidecars — requires `TESTRAIL_ENABLE_RAG_TOOLS=true` |

## Test execution & tracking

Create runs and report results. [Full details →](./execution.md)

| Tool | Mode | What it does |
| --- | --- | --- |
| `query_run` | `read` | Fetch one run by ID, or list runs in a project with filters |
| `mutate_run` | `write` | Create or update a test run, including its case selection |
| `get_tests` | `read` | List the tests inside a run, optionally filtered by status |
| `get_results` | `read` | Read the execution history for a single test |
| `add_results` | `write` | Submit results addressed by `test_id` |
| `add_results_for_cases` | `write` | Submit results addressed by `case_id` |

## Attachments & media

Upload and download files. [Full details →](./attachments.md)

| Tool | Mode | What it does |
| --- | --- | --- |
| `add_attachment` | `write` | Attach a file to a case, run, or result; directories are zipped automatically |
| `query_attachment` | `read` | Download one attachment to disk, or list attachment metadata for a case or run |

## Shared steps

Reusable step definitions. Requires `TESTRAIL_ENABLE_SHARED_STEPS=true`. [Full details →](./shared-steps.md)

| Tool | Mode | What it does |
| --- | --- | --- |
| `get_shared_step` | `read` | Fetch one shared step set by ID |
| `get_shared_steps` | `read` | List shared step sets in a project |
| `get_shared_step_history` | `read` | Read the version history of a shared step set |
| `add_shared_step` | `write` | Create a shared step set |
| `update_shared_step` | `write` | Update a shared step set, propagating to every linked case |

## System metadata

Instance configuration the model needs in order to generate valid data. [Full details →](./metadata.md)

| Tool | Mode | What it does |
| --- | --- | --- |
| `get_statuses` | `read` | List result statuses such as Passed, Failed, Blocked, Retest |
| `get_priorities` | `read` | List priority levels with their numeric IDs |
| `get_case_fields` | `read` | List custom field definitions and dropdown options |
| `get_templates` | `read` | List case templates, such as Test Case (Steps) |
| `get_labels` | `read` | List tags and labels available in a project |
| `get_configurations` | `read` | List configuration groups, such as Browser or OS |

## Deletion

Destructive and disabled by default. Requires `TESTRAIL_ALLOW_DELETE_OPERATIONS=true`. [Full details →](./deletion.md)

| Tool | Mode | What it does |
| --- | --- | --- |
| `delete_entity` | `delete` | Permanently delete a case, shared step, or attachment |

## Frequently asked questions about the tools

### How do I stop a specific tool from being available?

Set `TESTRAIL_DISABLED_TOOLS` to a comma-separated list of tool names, for example `TESTRAIL_DISABLED_TOOLS=mutate_suite,delete_entity`. The server validates the names on startup and refuses to start if any of them are misspelled. See [Configuration](../guide/configuration.md#disabling-specific-tools).

### Why does the server expose one tool for several operations?

Tools such as `query_project`, `mutate_run`, and `query_section` use a discriminated union on an `action` field, so a single tool covers `one`/`many` or `create`/`update`. This keeps the number of tool definitions injected into the model's prompt low, which reduces token usage and the chance of the model picking the wrong tool.

### Can I call these tools without an AI assistant?

Yes. Every tool listed here is also a `testrail-cli` subcommand with the same parameters and validation. See the [CLI and CI/CD guide](../guide/cli.md).

### Which tools cost the most context tokens?

`get_cases`, `get_case_history`, and `export_cases_for_rag` can return large payloads. All three accept an output path (`output_file` or `output_dir`) that writes results to disk and returns only a short summary to the model, keeping the context window free.
