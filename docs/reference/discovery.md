---
title: Discovery & Navigation Tools
description: TestRail MCP tools for browsing projects, test suites, sections, and users — query_project, query_suite, mutate_suite, query_section, mutate_section, and get_users.
faq: true
---

# Discovery and navigation tools

These six tools let an AI assistant map the structure of your TestRail instance before it reads or writes anything. TestRail organises work as **project → suite → section → case**, and an assistant that has not walked that hierarchy cannot know where a new test case belongs. In practice a conversation starts here: list the projects, find the suite, locate the section, then act.

| Tool | Mode | Purpose |
| --- | --- | --- |
| [`query_project`](#query-project) | `read` | One project by ID, or all active projects |
| [`query_suite`](#query-suite) | `read` | One suite by ID, or all suites in a project |
| [`mutate_suite`](#mutate-suite) | `write` | Create or update a suite |
| [`query_section`](#query-section) | `read` | One section or a section tree, or a filtered list |
| [`mutate_section`](#mutate-section) | `write` | Create or update a section, including nested ones |
| [`get_users`](#get-users) | `read` | Active users, for resolving assignees |

Several of these tools take a single `action` parameter that selects the operation. One tool covering both "fetch one" and "list all" keeps the model's prompt smaller and gives it fewer chances to pick the wrong tool.

## `query_project`

Retrieves project information. Projects are the top of the TestRail hierarchy, so this is usually the first call in a conversation.

- **`action: "one"`** — fetch full details for a single project by `project_id`.
- **`action: "many"`** — list every active project in the instance. Completed projects are filtered out, so the model is not offered archived work.

## `query_suite`

Retrieves test suite information. A suite is a container of sections and cases; single-suite projects have exactly one, while multi-suite projects can have many.

- **`action: "one"`** — fetch a single suite by `suite_id`.
- **`action: "many"`** — list all suites for a `project_id`.

> [!TIP]
> If a write tool rejects your request because `suite_id` is missing, the project is configured for multiple suites or baselines (`suite_mode` 2 or 3). Call `query_suite` with `action: "many"` to find the right ID, then pass it explicitly.

## `mutate_suite`

Creates or updates test suites.

- **`action: "create"`** — create a suite from `project_id` and `name`, with an optional `description`.
- **`action: "update"`** — change the `name` or `description` of an existing suite by `suite_id`.

## `query_section`

Retrieves sections, the folders that hold test cases within a suite.

- **`action: "one"`** — fetch a single section by `section_id`. Set `include_child: true` (with `project_id`, plus `suite_id` for multi-suite projects) to get the section back as a recursive tree with every nested child section, rather than making one call per level.
- **`action: "many"`** — list sections for a `project_id` and optional `suite_id`. Supports two useful narrowing options:
  - `name_pattern` — a regular expression matched against section names, such as `'auth.*'` or `'login|signup'`.
  - `output_file` — writes the full result to a file on disk and returns a short summary, so a large section tree does not consume the model's context window.

## `mutate_section`

Creates or updates sections.

- **`action: "create"`** — create a section from `project_id` and `name`, with optional `suite_id`, `parent_id`, and `description`. Pass `parent_id` to nest the new section inside an existing one.
- **`action: "update"`** — change the `name` or `description` of an existing section by `section_id`.

## `get_users`

Retrieves active users, which is how assignee names in a prompt ("assign it to me", "give it to Dana") become TestRail user IDs. Pass an optional `project_id` to scope the list to one project.

> [!TIP]
> **Non-admin fallback.** TestRail's global user list requires administrator rights and returns a permissions error otherwise. The server detects that rejection and instead polls every active project for its users, deduplicating the results. Assignee lookups therefore keep working on ordinary accounts, without any configuration.

## Frequently asked questions

### How does an AI assistant find the right place to add a test case?

It walks the hierarchy. `query_project` with `action: "many"` lists the projects, `query_suite` narrows to a suite, and `query_section` locates the folder. For deep structures, `query_section` with `action: "one"` and `include_child: true` returns the whole nested tree in a single call, which is both faster and cheaper than paging through levels. Once the section ID is known, `add_case` can write into it.

### What is the difference between a project, a suite, and a section in TestRail?

A project is the top-level container for a product or team. A suite is a collection of test cases inside a project; projects can be configured for a single suite or for many. A section is a folder inside a suite, and sections can be nested to arbitrary depth. Test cases live in sections.

### Why do some tools need a `suite_id` and others do not?

It depends on the project's `suite_mode`. Single-suite projects have an implicit suite, so TestRail can infer it. Projects using multiple suites or baselines cannot be disambiguated, so the server validates up front that `suite_id` was supplied and returns a clear error instead of letting TestRail fail the request.

### Can the assistant create the folder structure for me?

Yes. `mutate_suite` creates suites and `mutate_section` creates sections, including nested ones through `parent_id`. Both are `write` mode, so they are available by default and can be blocked with `TESTRAIL_ALLOW_WRITE_OPERATIONS=false` or by naming them in `TESTRAIL_DISABLED_TOOLS`.
