---
title: Test Case Management Tools
description: TestRail MCP tools to read, create, update, and bulk-edit test cases with custom field validation, plus case history and Markdown export for RAG.
faq: true
---

# Test case management tools

These nine tools are the core of the TestRail MCP Server: they let an AI assistant read your existing test cases and write new ones. The hard part of writing test cases through an API is not the text, it is the schema — every TestRail instance has its own templates, priorities, types, and custom fields, and a request with an unknown field key is rejected. These tools resolve that schema first and validate against it before anything is sent.

| Tool | Mode | Purpose |
| --- | --- | --- |
| [`get_case`](#get-case) | `read` | One case, with custom fields resolved to readable values |
| [`get_cases`](#get-cases) | `read` | Many cases, with filtering, recursion, and file export |
| [`add_case`](#add-case) | `write` | Create a case, validated against the instance schema |
| [`update_case`](#update-case) | `write` | Partially update one case |
| [`update_cases`](#update-cases) | `write` | Apply the same change to many cases |
| [`get_case_fields`](#get-case-fields) | `read` | Discover field definitions and dropdown options |
| [`resolve_case_field`](#resolve-case-field) | `read` | Turn multi-select reference IDs into labels |
| [`get_case_history`](#get-case-history) | `read` | Revision history — requires a feature flag |
| [`export_cases_for_rag`](#export-cases-for-rag) | `read` | Markdown export for RAG — experimental |

## `get_cases`

Lists test cases in a project or a specific section. This is the workhorse read tool, and it is built to survive large repositories.

- **Automatic pagination.** Complete result sets are assembled for you, on both modern paginated endpoints and legacy pre-7.x array responses.
- **Recursive traversal.** Walk a section and all of its descendants in one call, with the option to skip named sections.
- **Server-side filters.** Narrow by TestRail's own parameters, such as `priority_id`, `type_id`, `milestone_id`, and `refs`.
- **Client-side filters.** Use `where` to match exact field values, including custom fields, for conditions the TestRail API cannot express: `{"custom_automation_status": 1}`.
- **Field projection.** Request only the fields you need, rather than whole case objects.

> [!TIP]
> **Large data sets.** Pass `output_file` with an absolute path and the server writes the raw JSON to disk, returning only a concise summary to the model. A query across thousands of cases then costs a handful of tokens instead of exhausting the context window.

## `get_case`

Fetches one test case in full: mapped custom fields, custom steps split into descriptions and expected results, labels, and system metadata. Custom field IDs are resolved to readable values, so the model sees `"Priority": "Critical"` rather than an opaque integer.

Case IDs are accepted in either form — `123` or `C123` — because that is how people write them in chat and in tickets.

## `add_case`

Creates a test case in a section. Before the request is sent, every field key is validated against the instance's real schema: system fields plus the active custom fields for that project. Unknown keys are rejected with a descriptive error rather than being passed to TestRail, which means the model cannot invent a field that does not exist and then fail opaquely.

For multi-suite projects, the server also checks that `suite_id` was supplied where TestRail requires it.

## `update_case`

Partially updates a single case by ID (`123` or `C123`). Only the fields you pass are changed, so you can rewrite the steps without touching the title, or bump the priority without resubmitting the body. The same field validation as `add_case` applies.

## `update_cases`

Applies one set of field values to many test cases at once. Give it a list of case IDs and the fields to change, and the update is submitted as a bulk operation rather than one request per case. Useful for sweeping changes such as reassigning a milestone or marking a group of cases as automated.

## `get_case_fields`

Returns the case field schema for your instance: field types, labels, whether a field is required, its project scope, and the available options for dropdown and multi-select fields. Supports filtering by `project_id`.

This is the tool that makes reliable case creation possible. It tells the model which fields are mandatory and which integer IDs correspond to which dropdown labels, so generated payloads match your configuration on the first attempt.

## `resolve_case_field`

Resolves numeric reference IDs on multi-select fields (`type_id: 12`) into their textual values for a given project.

**Why it exists:** when you fetch a case, multi-select fields — tags, components, owning teams, environments — come back as raw integer arrays such as `[1, 55, 6]`. Without a lookup, neither you nor the model knows what those mean.

- **Readable labels.** `[1, 55, 6]` becomes `["Authentication", "Settings", "Billing"]`.
- **Token efficiency.** Resolving just the references in play is far cheaper than dumping every option of every field in the project into the prompt.
- **Project-aware.** Options can differ per project, and the mapping respects that.

**Parameters**

| Parameter | Description |
| --- | --- |
| `project_id` | Project whose field configuration should be used |
| `field_name` | System name of the multi-select field, such as `custom_case_feature_tags` |
| `refs` | A single numeric ID or an array of them, such as `55` or `[1, 55, 6]` |

## `get_case_history`

*Requires `TESTRAIL_ENABLE_CASE_HISTORY=true`.*

Returns the revision history and change diffs for a test case. This is what makes drift detection possible: comparing when a case last changed against when its automated counterpart was last updated tells you which automation is now out of date.

**Parameters**

| Parameter | Description |
| --- | --- |
| `case_id` | Case ID, as `123` or `C123` |
| `limit` | Return only the last N revisions |
| `after_revision` | Return only revisions newer than a given revision ID |
| `after_timestamp` | Return only revisions created after a Unix timestamp |
| `order` | `desc` for newest first, `asc` for oldest first |
| `output_file` | Write a long history to disk instead of the context window |

## `export_cases_for_rag`

*Experimental. Requires `TESTRAIL_ENABLE_RAG_TOOLS=true`.*

> [!WARNING]
> This tool is under active design. Expect breaking changes to its API and output structure in upcoming releases.

Exports test cases as clean Markdown documents with companion JSON metadata sidecars, ready for ingestion into a knowledge base or vector store — Amazon Bedrock Knowledge Bases, Pinecone, Weaviate, and similar. The goal is to let an AI assistant answer questions about test coverage from a retrieval index rather than by calling the TestRail API on every question.

### What it produces

Each exported case becomes two files:

- **`<case>.md`** — the title, section header, preconditions, numbered steps with their expected results, and any unstructured text fields, formatted as readable Markdown.
- **`<case>.md.metadata.json`** — a sidecar of structured `metadataAttributes` for filtering and retrieval: case ID, `updated_on`, title, section, priority, references, resolved multi-select tag strings, dropdowns, and checkboxes.

### Why the sidecar carries `updated_on`

The `updated_on` timestamp already comes back from `get_case` and `get_cases`, and putting it in the sidecar enables three things without any extra API calls:

- **Incremental sync.** An ingestion pipeline compares `updated_on` against the stored sidecar, or uses TestRail's `updated_after` filter on `get_cases`, to find changed cases — no full-text hashing or diffing, and no `get_case_history` call per case.
- **Stale vector eviction.** As soon as a case's `updated_on` changes, the pipeline knows to invalidate the old embedding.
- **Version citations.** The assistant can state when the steps it is citing were last updated.

### Export modes

- **By explicit IDs.** Pass `case_ids`, such as `['C123', 456]`.
- **By query.** Pass `project_id` with optional `suite_id`, an API-side `filter`, and a client-side `where`, and matching cases are found and exported in one step.

**Parameters**

| Parameter | Description |
| --- | --- |
| `case_ids` | Cases to export, such as `['C123', 456]`. Provide either this or `project_id`. |
| `project_id` | Project to export from. Required when `case_ids` is absent. |
| `suite_id` | Suite to scope to. Required for multi-suite projects. |
| `filter` | API-side filters, such as `priority_id`, `type_id`, `milestone_id`, `refs` |
| `where` | Client-side exact-match filter, including custom fields |
| `output_dir` | Destination directory for the `.md` and `.metadata.json` files |
| `ignored_fields` | Custom fields to exclude, by `system_name` or its stripped form |

`ignored_fields` accepts either the full system name or the name without the `custom_` prefix, so `custom_review_status` and `review_status` both work. The core attributes — `case_id`, `updated_on`, `title`, `section`, `priority`, `references`, `labels` — cannot be excluded, because ingestion pipelines depend on them.

> [!TIP]
> **Always set `output_dir`.** Without it, the tool creates a timestamped `rag_export_<timestamp>` folder in the detected project directory. When the server is registered in a global or user-level MCP configuration, its working directory may be `/` or your home directory, in which case the export lands in `~/rag_export_<timestamp>` — probably not where you expected. Pass `output_dir` explicitly, or tell your assistant to use a path like `./rag_export`.

For batches larger than about 25 cases, split the work into parallel chunks of roughly 25 to avoid tool-call timeouts.

## Frequently asked questions

### How do I get an AI assistant to create TestRail test cases correctly?

Let it read the schema before it writes. `get_case_fields` returns the required fields, types, and dropdown options for the project, and `get_templates` returns the available case templates. `add_case` then validates every field key against that schema and rejects unknown keys before contacting TestRail. In practice this means asking "which fields are required to create a case in project 3?" before "now create the case" produces reliable results.

### Can I update many test cases at once?

Yes, with `update_cases`. Pass the case IDs and the fields to change, and the same values are applied to all of them in a bulk request rather than one call per case. Use `update_case` when each case needs different values.

### Why do multi-select fields return numbers instead of text?

TestRail stores multi-select values as reference IDs, so a tags field comes back as something like `[1, 55, 6]`. Call `resolve_case_field` with the project ID, the field's system name, and those references to get `["Authentication", "Settings", "Billing"]` back. Resolving on demand costs far fewer tokens than loading every option for every field up front.

### How do I fetch thousands of test cases without blowing the context window?

Pass `output_file` to `get_cases`. The server paginates through the whole result set, writes the raw JSON to that path, and returns only a short summary to the model. You then process the file with `jq` or a script. `get_case_history` and `query_section` accept the same parameter.

### Does `C123` work as a case ID, or do I need the number?

Both work. Every tool that takes a case ID normalises the input, so `123`, `'123'`, and `'C123'` are equivalent, with surrounding whitespace trimmed. Invalid values produce a descriptive error rather than a silent misfire.

### How do I keep a knowledge base in sync with TestRail?

Use `export_cases_for_rag` on a schedule and rely on the `updated_on` attribute in each sidecar. Your pipeline compares the timestamp it has stored against the current one to decide which documents to re-embed, and evicts the vectors for cases whose timestamp has moved. The [CLI guide](../guide/cli.md#github-actions-sync-testrail-cases-into-a-knowledge-base) has a complete GitHub Actions workflow that does this weekly.
