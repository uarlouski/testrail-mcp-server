# Test Case Management

Tools specifically designed for fetching, creating, updating, and bulk-editing test cases.

### `get_cases`
Query a list of test cases within a project or specific section. This tool supports advanced filtering via parameters like priority, template, or type. It automatically handles pagination to retrieve complete lists.

> [!TIP]
> **Large Data Sets**: If you expect thousands of cases, supply the `output_file` parameter with an absolute file path. The server will bypass the LLM context window by writing the raw JSON directly to disk and returning a concise summary.

### `get_case`
Fetch complete, structured details of a single, specific test case by its ID. This includes mapped custom fields, custom steps (separated by descriptions and expected results), and system metadata.

### `get_case_history`
*(Gated by `TESTRAIL_ENABLE_CASE_HISTORY=true`)*

Retrieve the audit and revision history for a specific test case. Essential for AI agents and sync pipelines tracking test case evolution and drift against automated tests.
- **Parameters**:
  - `case_id`: Case ID (e.g. `'123'` or `'C123'`)
  - `limit`: Fetch the last N revisions (e.g. `5`)
  - `after_revision`: Return only revisions newer than a specific revision ID
  - `after_timestamp`: Return only revisions created after a specific unix timestamp
  - `order`: Sort order (`'desc'` for newest first, `'asc'` for oldest first)
  - `output_file`: Optional file path to export large history logs

### `add_case`
Seamlessly create a new test case within a specific section. This tool performs robust pre-validation of custom fields to ensure the payload exactly matches what the TestRail instance requires before sending the request.

### `update_case`
Modify an existing test case. You can perform partial updates to change specific fields (like updating steps, changing the title, or adjusting the priority) without overwriting the entire case.

### `update_cases`
Execute bulk-updates on multiple test cases simultaneously. Provide a list of case IDs and the fields you want to change, and the server will apply the same update to all cases efficiently.
