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

### `resolve_case_field`
Resolve numeric reference IDs for Multi-select test case fields (`type_id: 12`) into their human-readable textual values for a specific project.

- **Why it's useful**:
  - **Translates Raw Numeric Arrays**: When retrieving test cases via `get_case`, Multi-select fields (e.g., tags, components, environments) return raw integer ID arrays like `[1, 55, 6]`. This tool converts those opaque IDs into clear textual labels (e.g., `["Authentication", "Settings", "Billing"]`).
  - **Token & Context Optimization**: Rather than dumping massive lists of hundreds of options for every field across the whole project, AI assistants can resolve only the specific references they need on-demand, saving significant LLM context tokens.
  - **Project-Aware Mapping**: Accurately maps IDs based on project-specific field configurations when options vary across projects.

- **Parameters**:
  - `project_id`: The ID of the project to scope field configuration
  - `field_name`: The system name of the Multi-select field (e.g. `'custom_case_feature_tags'`)
  - `refs`: A single numeric ID or array of numeric IDs/references (e.g. `[1, 55, 6]` or `55`) to resolve

### `export_cases_for_rag`
*(Experimental, gated by `TESTRAIL_ENABLE_RAG_TOOLS=true`)*

> [!WARNING]
> **Experimental Feature**: This tool is currently experimental and undergoing active design iteration. Expect major breaking changes to this API and its data structures in upcoming releases.

Export test cases formatted as clean Markdown documents with companion JSON metadata sidecar files (`.metadata.json`) for Knowledge Base and RAG (Retrieval-Augmented Generation) ingestion.

- **How it works**:
  - **Dynamic Markdown Document**: Formats test case title, section header, preconditions, numbered steps & expected results, and unstructured text fields into a clean Markdown `.md` document.
  - **Companion Metadata Sidecar**: Generates a `.md.metadata.json` sidecar file containing structured attributes (`metadataAttributes`) such as case ID, title, section, priority, references, resolved multi-select tag strings, dropdowns, and checkboxes for vector search filtering and retrieval.
- **Parameters**:
  - `case_ids`: Array of test case IDs to export (e.g. `['C123', 456]`)
  - `output_dir`: *(Optional)* Target directory path to save exported `.md` and `.metadata.json` files
  - `ignored_fields`: *(Optional)* Array of custom field names or system names to ignore/exclude from export (e.g. `['custom_review_status', 'review_status']`). Supports both full `system_name` and stripped field names (without `custom_` prefix). Core metadata attributes (`case_id`, `title`, `section`, `priority`, `references`, `labels`) cannot be ignored.

> [!TIP]
> **Output Directory in Global / User MCP Configurations**:
> When `output_dir` is not specified, the tool defaults to auto-generating a timestamped folder (`rag_export_<timestamp>`) in the detected project directory.
> 
> However, if the MCP server is registered in a global or user-level MCP configuration, the MCP server process may be spawned with its working directory set to root (`/`) or the home directory (`~`). In this scenario, the export folder is automatically created inside the user's home directory (`~/rag_export_<timestamp>`).
> 
> **Best Practice**: We recommend explicitly specifying the `output_dir` parameter (or instructing your AI assistant to pass the current project path, e.g. `./rag_export`) to ensure exported test cases land directly in your active workspace.
