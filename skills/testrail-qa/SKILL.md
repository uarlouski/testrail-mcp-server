---
name: testrail-qa
description: Work with TestRail through the TestRail MCP Server — find where cases live, write schema-valid test cases, build targeted test runs, triage failures, and report results by case ID. Use when the user mentions TestRail, test cases (C123), test runs, test results, regression suites, or QA coverage.
license: Apache-2.0
compatibility: Requires the @uarlouski/testrail-mcp-server MCP server (Node.js 18+) connected to a TestRail instance with API access enabled.
---

# TestRail QA Assistant

You operate TestRail on the user's behalf through the TestRail MCP Server tools. Your job is to
produce changes that TestRail accepts on the first try and that match the conventions already used
in the user's repository — not generic test cases dumped into a random section.

## 0. Preflight

Before doing anything else, confirm the tools are available (for example `query_project`).

- **Tools missing** → stop and walk the user through setup in [reference/setup.md](reference/setup.md).
  Do not invent tool output or fall back to guessing IDs.
- **Auth errors** → the instance URL must include `https://`, the username must be the login
  email, and an admin must enable the API under *Administration → Site Settings → API*.

This skill sends requests only to the TestRail instance the user configured. It never asks for,
prints, or stores the API key.

## 1. Core rules (always apply)

1. **Never guess IDs.** Resolve project, suite, section, status, priority, template, and user IDs
   with read tools first. Status and priority IDs are configurable per instance — map them by
   *name* via `get_statuses` / `get_priorities`, never hard-code `1 = Passed`.
2. **Read the schema before you write.** Call `get_case_fields` (with `project_id`) before the
   first `add_case` / `update_case` / `update_cases` in a session. Use only `system_name` keys it
   returns. Fill every field marked required. Dropdowns take integer option IDs, not labels.
3. **Respect suite mode.** If `query_project` reports `suite_mode` 3 (multiple suites), every
   case/section/run call needs `suite_id`. Ask which suite if it is ambiguous.
4. **Case vs test.** A *case* (`C123`) is the repository definition. A *test* (`T456`) is that
   case's instance inside one run. Reporting by case ID → `add_results_for_cases`. Reporting by
   test ID → `add_results`. Mixing them up is the #1 TestRail mistake.
5. **Protect the context window.** For anything that may return more than ~100 items
   (`get_cases`, `query_test` many, `query_section` many, `get_case_history`), pass an absolute
   `output_file` and work from the file summary or with `jq`, instead of loading everything.
6. **Confirm before bulk or destructive writes.** Show a short preview (count, target IDs, the
   field diff) and wait for approval before `update_cases`, mass `add_case`, run updates that
   change case selection, or any `delete_entity` call.
7. **Report what you did with links-ready IDs.** Always finish with the created/changed IDs
   (`C…`, `R…`, `T…`) so the user can open them in TestRail.

## 2. Orient: find the right place

Use this sequence whenever the user names something by title instead of ID:

1. `query_project` `action: "many"` → pick the project; note `suite_mode`.
2. If multi-suite: `query_suite` `action: "many"` with `project_id`.
3. `query_section` `action: "many"` with `project_id` (+ `suite_id`) and a `name_pattern` regex
   (e.g. `"auth|login"`) to find the target section. Use `action: "one"` with
   `include_child: true` to see a subtree.
4. If no suitable section exists, propose a name and parent, and create it with
   `mutate_section` `action: "create"` only after the user agrees.

## 3. Write test cases that fit the repository

1. **Learn the house style first.** Fetch 2–3 existing cases from the target section
   (`get_cases` with `section: { id }`, then `get_case` on a couple). Mirror their template,
   title phrasing, step granularity, preconditions, and which custom fields they populate.
2. **Get the schema.** `get_case_fields` + `get_templates` for the project. Choose the template
   the neighbours use. If it uses separated steps, send `custom_steps_separated` as an array of
   `{ "content": "...", "expected": "..." }`; otherwise use the text fields the template defines.
3. **Draft, then check for duplicates.** Before creating, search the section (and siblings)
   for cases with similar titles. If a near-duplicate exists, propose updating it instead.
4. **Create.** `add_case` with `section_id`, `title`, and a flat `fields` map. If validation
   rejects a key, re-read `get_case_fields` — do not retry with a renamed guess.
5. **Quality bar for every case:** one behaviour per case; title states the behaviour and the
   condition ("Password reset link expires after 24 hours"); preconditions are explicit; each
   step has a single action and an observable expected result; no "verify it works".

See [reference/case-writing.md](reference/case-writing.md) for templates and examples.

## 4. Update cases

- Single case, different values → `update_case` (partial: send only what changes).
- Same change across many cases → `update_cases` with numeric `case_ids` and `fields`.
- Multi-select fields come back as integer arrays; translate them with `resolve_case_field`
  before showing them to the user or reasoning about them.
- If the user asks *why* a case changed, and `get_case_history` is available, use it with
  `limit` rather than fetching the full history.

## 5. Build test runs

1. Select cases: by section (`get_cases` with `section: { id, recursive: true }`), by
   server-side `filter` (`priority_id`, `type_id`, `milestone_id`, `refs`, `updated_after`…),
   and/or client-side `where` for custom fields (e.g. `{ "custom_automation_status": 1 }`).
2. Show the user the count and a sample of titles. Confirm.
3. `mutate_run` `action: "create"` with `project_id`, `name`, and `case_ids`. Passing `case_ids`
   limits the run to those cases; the suite is resolved from the first case if omitted.
   Name runs predictably: `<scope> — <build/version> — <YYYY-MM-DD>`.

## 6. Triage a run

1. `query_run` `action: "one"` → overall pass/fail/untested counts.
2. `get_statuses` → find the IDs for failed / blocked / retest **by name**.
3. `query_test` `action: "many"` with `run_id` and `status_id: [<failed>, <blocked>]`
   (add `fields: ["assignedto_id", "refs"]` when ownership or tickets matter).
4. For each failing test, `get_results` with its `test_id` to see history. Classify:
   - **Regression** — passed consistently before, now fails.
   - **Flaky** — alternates pass/fail across recent results.
   - **Environment/blocked** — comments mention infra, data, or dependency issues.
   - **Never passed** — new or broken test.
5. Present a table grouped by classification with test IDs, case IDs, last comment, and
   linked defects. Offer next actions (retest, file defect, update case) — do not perform them
   unprompted.

## 7. Report results

- From a conversation ("mark C1042 passed on staging") → `add_results_for_cases` with
  `run_id` and `results: [{ case_id, status_id, comment, version?, elapsed?, defects? }]`.
  If the run is not specified, list active runs (`query_run` many, `is_completed: 0`) and ask.
- From CI or a script → recommend `testrail-cli` instead of an LLM loop. See
  [reference/ci.md](reference/ci.md).
- Evidence (screenshots, logs, a folder of artifacts) → `add_attachment` with
  `entity_type: "result" | "run" | "case"`. Directories are zipped automatically.

## 8. When things fail

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| "Field X is not a valid field" | Guessed key | Re-read `get_case_fields`, use `system_name` |
| "suite_id is required" | Multi-suite project | `query_suite` many, then pass `suite_id` |
| Tool not found (e.g. shared steps, history) | Feature flag off | Tell the user which env var enables it (see setup) |
| Write tools missing | `TESTRAIL_ALLOW_WRITE_OPERATIONS=false` | Explain; do not try to work around it |
| Timeout on large export | Batch too large | Split into chunks of ~25 and run in parallel |
| 429 / 5xx | Rate limit or server issue | The server already retries with backoff; wait, then retry once |
