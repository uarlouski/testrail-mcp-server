---
title: Test Execution & Tracking Tools
description: TestRail MCP tools for creating test runs and reporting results — query_run, mutate_run, get_tests, get_results, add_results, and add_results_for_cases.
faq: true
---

# Test execution and tracking tools

These six tools cover the execution half of TestRail: creating test runs, inspecting the tests inside them, and reporting pass/fail results. They are what turn "the regression suite finished" into a recorded, auditable run — whether the report comes from a chat message or from a CI job using the [CLI](../guide/cli.md).

| Tool | Mode | Purpose |
| --- | --- | --- |
| [`query_run`](#query-run) | `read` | One run by ID, or a filtered list of runs |
| [`mutate_run`](#mutate-run) | `write` | Create or update a run |
| [`get_tests`](#get-tests) | `read` | The tests inside a run |
| [`get_results`](#get-results) | `read` | Execution history for one test |
| [`add_results`](#add-results) | `write` | Report results by `test_id` |
| [`add_results_for_cases`](#add-results-for-cases) | `write` | Report results by `case_id` |

> [!NOTE]
> **Cases, tests, and results.** A *case* is the reusable definition in the repository. When a case is included in a run, TestRail creates a *test* — that case's instance in that run, with its own `test_id`. A *result* is one recorded execution of a test. Most of the confusion in TestRail's API comes from mixing up `case_id` and `test_id`, which is why two result tools exist.

## `query_run`

Retrieves test run information.

- **`action: "one"`** — fetch a single run by `run_id`, including its pass, fail, and untested counts.
- **`action: "many"`** — list runs for a `project_id`, narrowing with filters such as `suite_id` and `is_completed` (`1` for completed, `0` for active).

## `mutate_run`

Creates or updates test runs.

- **`action: "create"`** — create a run from `project_id` and `name`, optionally scoped to a `suite_id`, assigned to a milestone, and limited to specific `case_ids`.
- **`action: "update"`** — change an existing run by `run_id`: its name, description, or the set of cases it contains.

TestRail's `include_all` flag is derived for you rather than being a parameter:

- Supply `case_ids` and the run is limited to exactly those cases.
- Supply neither `case_ids` nor `suite_id` and the run includes every case.
- Supply `case_ids` without a `suite_id` and the suite is resolved automatically by looking up the first case — so you do not have to know the suite ID to build a targeted run.

## `get_tests`

Lists the individual tests inside a run. Pass an optional `status_id` to filter, which is the quickest way to answer "what failed in run 88?" or "what is still untested?" without pulling the whole run.

Combine it with [`get_statuses`](./metadata.md#get-statuses) to map status IDs to their names, since they are configurable per instance.

## `get_results`

Returns the result history for a single test, newest first and fully paginated. Because it shows every recorded execution rather than the current state, it is the tool for judging whether a test is genuinely broken or merely flaky.

## `add_results`

Submits results for tests in a run, addressed by `test_id`. Each result can carry a `status_id`, a `comment`, an elapsed time, a version, and defect references. Use this when you already hold the `test_id`, for example after calling `get_tests`.

## `add_results_for_cases`

Submits results for a run addressed by `case_id` instead of `test_id`.

This is the tool automation should almost always use. A test framework knows the case ID from an annotation or tag in the test code; it does not know the per-run `test_id` that TestRail generated. `add_results_for_cases` closes that gap, so a CI job can report straight into a run without first resolving IDs.

**Parameters**

| Parameter | Description |
| --- | --- |
| `run_id` | The run to report into |
| `results` | Array of results, each requiring `case_id` and `status_id`, optionally with `comment`, `elapsed`, `version`, and `defects` |

## Frequently asked questions

### What is the difference between `add_results` and `add_results_for_cases`?

`add_results` identifies each result by `test_id`, the ID of a case's instance within one specific run. `add_results_for_cases` identifies results by `case_id`, the stable ID of the case in the repository. Automated suites know case IDs, not test IDs, so `add_results_for_cases` is the right choice for CI; `add_results` fits interactive workflows where you have already listed the run's tests.

### How do I report automated test results to TestRail from a CI pipeline?

Create or reference a run, then call `add_results_for_cases` with a JSON array of results keyed by `case_id`. No AI assistant is needed — the bundled `testrail-cli` exposes the same tool as a shell command with the same validation. The [CLI guide](../guide/cli.md#report-automated-test-results) has working GitHub Actions, GitLab CI, and Jenkins examples.

### Which status ID means passed?

In a default TestRail installation `1` is Passed, `2` is Blocked, `4` is Retest, and `5` is Failed, but statuses are configurable and instances often add custom ones. Call `get_statuses` and map by name instead of hard-coding the integers.

### How do I create a test run containing only certain test cases?

Call `mutate_run` with `action: "create"` and pass the case IDs in `case_ids`. The server sets `include_all` to false for you, and if you have not supplied a `suite_id` it resolves the suite from the first case — so a targeted run needs nothing more than the project ID, a name, and the case IDs.

### How do I find out which tests failed in a run?

Call `get_tests` with the `run_id` and a `status_id` filter for the failed status in your instance, which you can look up with `get_statuses`. For the history of one specific test across its executions, use `get_results` with that test's ID.
