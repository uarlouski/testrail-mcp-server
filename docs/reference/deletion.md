---
title: Deletion Tools
description: The delete_entity tool removes TestRail cases, shared steps, and attachments. Disabled by default and gated behind TESTRAIL_ALLOW_DELETE_OPERATIONS.
faq: true
---

# Deletion tools

There is exactly one delete tool, and it is the only tool in the server that is disabled out of the box. TestRail deletions are permanent, so giving a language model the ability to perform them has to be a deliberate choice rather than a default.

| Tool | Mode | Purpose |
| --- | --- | --- |
| [`delete_entity`](#delete-entity) | `delete` | Permanently delete a case, shared step, or attachment |

> [!WARNING]
> **Disabled by default.** `delete_entity` is not registered unless you set `TESTRAIL_ALLOW_DELETE_OPERATIONS=true`. Deletions in TestRail cannot be undone, and the server cannot recover data for you.

## `delete_entity`

Permanently deletes a TestRail entity.

**Parameters**

| Parameter | Description |
| --- | --- |
| `entity_type` | `"case"`, `"shared_step"`, or `"attachment"` |
| `entity_id` | The ID of that entity — `123` or `C123` for cases |

Because the tool declares `mode: "delete"`, the registry marks it with the MCP `destructiveHint` annotation. Clients that ask for confirmation before destructive tool calls will therefore prompt you, rather than treating it as an ordinary write.

## Frequently asked questions

### How do I enable deletion in the TestRail MCP Server?

Set `TESTRAIL_ALLOW_DELETE_OPERATIONS=true` in the server's environment and restart your MCP client. The value must be exactly the string `true`; anything else leaves deletion off. This is the only permission that defaults to disabled.

### Can an AI assistant delete my test cases by accident?

Not with the default configuration, because the delete tool is not registered at all and therefore is not visible to the model. Once you enable it, two further safeguards remain: the tool is annotated as destructive so compliant clients can require confirmation, and you can still remove it by name with `TESTRAIL_DISABLED_TOOLS=delete_entity` while leaving other delete-mode tools available in future versions.

### Can a deleted test case be recovered?

No. TestRail deletions are permanent and the MCP server keeps no copy. If you want to preserve the content before removing a case, export it first — `get_cases` with `output_file`, or `export_cases_for_rag`, both write full case content to disk.

### What can be deleted?

Test cases, shared step sets, and attachments, selected with `entity_type`. Projects, suites, sections, runs, and results are deliberately not deletable through this server; those operations have much wider blast radius and are better done in the TestRail UI, where the consequences are shown to you first.
