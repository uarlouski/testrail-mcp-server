# Test Execution & Tracking

Tools to create test runs, update results by `test_id` or `case_id`, and track testing status.

### `query_run`
Retrieves test run information using a discriminated union action.
- **Action "one"**: Fetch detailed information for a single test run by its `run_id`.
- **Action "many"**: Retrieve a list of all test runs for a project. Supports filtering by milestone, assignee, or creator.

### `mutate_run`
Performs write modifications on test runs using a discriminated union action.
- **Action "create"**: Create a new test run. You can specify a suite, assign it to a milestone, and include a specific array of `case_ids` to run.
- **Action "update"**: Modify an existing test run (e.g., updating its name, description, or modifying the list of included cases).

### `get_tests`
Retrieve individual tests associated with a specific test run. You can provide an optional `status_id` filter (e.g., to only retrieve failed or unassigned tests).

### `get_results`
Retrieve a paginated list of results (historical executions) for a specific test ID. Useful for analyzing the flakiness or history of a specific test.

### `add_results`
Submit test execution results to a test run. This tool maps results directly to the specific `test_id` within a run, allowing you to attach comments, statuses, and elapsed times.

### `add_results_for_cases`
Submit test execution results to a test run by referencing the `case_id` directly, rather than the `test_id`. This streamlines automation workflows where the original case ID is known, but the specific instance ID within the run is not.
