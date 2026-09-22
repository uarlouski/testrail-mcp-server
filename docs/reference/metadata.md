---
title: System Metadata Tools
description: TestRail MCP tools that expose instance configuration — statuses, priorities, custom fields, templates, labels, and configuration groups.
faq: true
---

# System metadata tools

TestRail is heavily configurable: statuses, priorities, templates, labels, and custom fields all differ between instances. A model that guesses at those values produces requests your instance rejects. These six read-only tools expose the real configuration so that generated data matches your setup instead of a generic default.

| Tool | Mode | Purpose |
| --- | --- | --- |
| [`get_statuses`](#get-statuses) | `read` | Result statuses and their IDs |
| [`get_priorities`](#get-priorities) | `read` | Priority levels and their IDs |
| [`get_case_fields`](#get-case-fields) | `read` | Custom field definitions and dropdown options |
| [`get_templates`](#get-templates) | `read` | Available case templates |
| [`get_labels`](#get-labels) | `read` | Tags and labels in a project |
| [`get_configurations`](#get-configurations) | `read` | Configuration groups such as Browser and OS |

> [!NOTE]
> Results from these endpoints are memoised in memory for the lifetime of the server process. Repeatedly asking for statuses or field definitions during one conversation costs a single HTTP request, not one per call.

## `get_statuses`

Lists the configured test result statuses — Passed, Failed, Blocked, Retest, plus any custom statuses your instance defines — with their integer IDs. This is what lets "mark it as passed" become the correct `status_id` for your instance rather than a hard-coded `1`.

## `get_priorities`

Returns the priority levels configured in the instance, with both integer IDs and names, so "critical" resolves to the ID your instance actually uses.

## `get_case_fields`

Returns custom field definitions: types, labels, whether a field is required, its project scope, and the options for dropdown and multi-select fields. Supports filtering by `project_id`.

This is the most important metadata tool. `add_case` and `update_case` validate against this schema, so it determines which fields the model may use and which integer IDs map to which dropdown labels. See [Test Case Management](./cases.md#get-case-fields).

## `get_templates`

Lists the case templates available in a project, such as **Test Case (Text)** and **Test Case (Steps)**. The template dictates the shape a case must take — whether steps are one text block or a structured list — so selecting the right one is what makes generated cases render correctly in the TestRail UI.

## `get_labels`

Returns the tags and labels available in a project, so labels applied to a case are ones that already exist rather than new free-text values.

## `get_configurations`

Returns the configuration groups and their configurations for a project — for example a Browser group containing Chrome, Firefox, and Safari, or an OS group containing Windows and macOS. These are the values used to describe the environment a test run targets.

## Frequently asked questions

### Why does the AI need to call metadata tools before creating a test case?

Because TestRail's API works in integers and system names, not the words in your prompt. "High priority" is a `priority_id` whose value differs between instances, and a custom field has a `system_name` the model cannot guess. These tools return the real mappings, and `add_case` validates field keys against them, so the payload is correct on the first attempt rather than after a round of rejected requests.

### Which status ID means passed in TestRail?

In a default installation `1` is Passed, `2` is Blocked, `4` is Retest, and `5` is Failed. Statuses are configurable, though, and many instances add their own, so call `get_statuses` and match on name rather than hard-coding the number.

### Are these metadata calls slow or expensive?

No. The client memoises priorities, case types, case fields, statuses, projects, templates, and individual sections in memory for the life of the server process, so the second and subsequent requests in a conversation are served without an HTTP call.

### What is a case template and why does it matter?

A template determines a case's structure — **Test Case (Text)** holds one free-text body, while **Test Case (Steps)** holds a numbered list of steps each with its own expected result. Submitting structured steps against a text template, or the reverse, produces a case that looks wrong in the TestRail UI. `get_templates` lets the model pick the template that matches the content it is generating.

### How do I find the custom fields available in my TestRail project?

Call `get_case_fields`, optionally scoped with `project_id`. The response gives each field's system name, type, whether it is required, its project scope, and the available options for dropdowns and multi-selects. To turn multi-select reference IDs from an existing case back into readable labels, use [`resolve_case_field`](./cases.md#resolve-case-field).
