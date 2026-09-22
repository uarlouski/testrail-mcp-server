---
title: Shared Steps Tools
description: TestRail MCP tools for reusable shared test steps — read, create, update, and audit them. Enabled with TESTRAIL_ENABLE_SHARED_STEPS.
faq: true
---

# Shared steps tools

Shared steps are TestRail's mechanism for reuse: one definition of a common sequence — logging in, seeding a cart, resetting a tenant — referenced by many test cases. Edit the shared step once and every linked case reflects the change.

| Tool | Mode | Purpose |
| --- | --- | --- |
| [`get_shared_steps`](#get-shared-steps) | `read` | List shared step sets in a project |
| [`get_shared_step`](#get-shared-step) | `read` | Fetch one shared step set by ID |
| [`get_shared_step_history`](#get-shared-step-history) | `read` | Version history for a shared step set |
| [`add_shared_step`](#add-shared-step) | `write` | Create a shared step set |
| [`update_shared_step`](#update-shared-step) | `write` | Update a shared step set |

> [!WARNING]
> **These five tools are disabled by default.** Set `TESTRAIL_ENABLE_SHARED_STEPS=true` to register them. Until you do, they are not exposed to the model at all, which keeps five tool schemas out of every prompt for the many teams that do not use shared steps.

## `get_shared_steps`

Lists the shared step sets configured in a project, with optional reference filtering to narrow the results.

## `get_shared_step`

Fetches the full detail of one shared step set by its ID, including every step with its expected result.

## `get_shared_step_history`

Returns the version history of a shared step set: what changed, when, and by whom. Because a single edit propagates to every linked case, this audit trail is the way to explain why a group of cases suddenly started testing something different.

## `add_shared_step`

Creates a reusable shared step set that can then be referenced from any number of test cases in the project.

## `update_shared_step`

Updates an existing shared step set.

> [!IMPORTANT]
> Updating a shared step set propagates immediately to **every** test case that references it. A one-line edit can therefore change the meaning of hundreds of cases at once. Check `get_shared_step_history` afterwards if you need to confirm exactly what changed.

## Frequently asked questions

### How do I enable the shared steps tools?

Add `TESTRAIL_ENABLE_SHARED_STEPS=true` to the server's environment and restart your MCP client. The five tools are off by default so that teams who do not use shared steps do not pay the prompt-token cost of their schemas. See the [Configuration guide](../guide/configuration.md#feature-flags).

### What are shared steps in TestRail?

A shared step set is a named, reusable sequence of test steps stored once at project level and referenced from many test cases. It removes the duplication of repeating a login or setup sequence in every case, and it means that when the procedure changes you edit one definition rather than every case that used it.

### What happens to existing test cases when I update a shared step?

The change takes effect immediately in every case that references the set — that is the point of shared steps, and also the risk. Treat an update as a change to all linked cases rather than a local edit, and use `get_shared_step_history` to audit what changed and when.

### Can an AI assistant create shared steps for me?

Yes, with `add_shared_step`, provided `TESTRAIL_ENABLE_SHARED_STEPS=true` and writes are permitted. A useful pattern is to ask the assistant to read several existing cases, identify the setup sequence they duplicate, create a shared step set from it, and then update those cases to reference it.

### Can I delete a shared step through the MCP server?

Yes, but not with these tools. Deletion goes through `delete_entity` with `entity_type: "shared_step"`, which additionally requires `TESTRAIL_ALLOW_DELETE_OPERATIONS=true`. See [Deletion](./deletion.md).
