# Changelog

## [2.8.0]

### Added
- Add consolidated `query_section` tool using discriminated union pattern (`action: "one"` | `"many"`):
  - `action: "one"`: Fetch a single section by `section_id`, with optional `include_child` flag to recursively construct a complete child section hierarchy tree.
  - `action: "many"`: List all sections for a project/suite, with support for case-insensitive regex name filtering (`name_pattern`) and direct filesystem export (`output_file`).
- Add optional `ignored_fields` parameter to `export_cases_for_rag` allowing callers to dynamically ignore/exclude custom fields by full `system_name` or stripped name (e.g., `['custom_review_status', 'review_status']`) from both Markdown documents and `.metadata.json` sidecar files.
- Support query-based case export in `export_cases_for_rag` via `project_id`, `suite_id`, `filter`, and `where` parameters, allowing test cases to be queried and exported directly without pre-fetching case IDs.

### Deprecated
- Deprecate `get_sections` tool in favor of `query_section` (`action: "many"`).

### Changed
- Make `case_ids` parameter optional in `export_cases_for_rag`, validating that either `case_ids` or `project_id` is supplied.
- Clean up `IGNORED_METADATA_FIELDS` in `export_cases_for_rag` to contain strictly standard TestRail system fields (`created_by`, `updated_by`, `display_order`, `is_deleted`), eliminating hardcoded org-specific custom fields.
- Refactor `export_cases_for_rag` to use unique `system_name` directly for field identification and metadata attributes, preventing collisions when custom fields share duplicate display labels while preserving UI labels for Markdown headings.
- Update `export_cases_for_rag` tool description with batching recommendations for datasets larger than 25 test cases to prevent MCP tool call timeouts.

### Fixed
- Sanitize boolean and checkbox custom metadata attributes into string values in `export_cases_for_rag` to ensure broad compatibility with Knowledge Base and RAG ingestion pipelines.

## [2.7.0]

### Added
- Add in-memory caching for `get_section` in client to avoid redundant API requests for repeated section lookups.

### Changed
- Scope custom field schema mapping in `export_cases_for_rag` to global fields and fields matching the current test case template to prevent field definition collisions across templates.

### Fixed
- Improve `export_cases_for_rag` output directory resolution to prevent root filesystem write errors (`ENOENT`) when the MCP server is registered in a global or user-level MCP configuration. Now the export folder is automatically created inside the user's home directory.

## [2.6.0]

### Added
- Add `export_cases_for_rag` tool (gated by `TESTRAIL_ENABLE_RAG_TOOLS`) to export test cases as formatted Markdown documents with companion JSON metadata sidecar files for Knowledge Base and RAG ingestion.
- Add `TESTRAIL_DISABLED_TOOLS` environment variable (comma-separated list) to disable specific tools by name. Includes startup validation that raises an error listing all non-existent tools if unknown tool names are specified.

### Changed
- Enhance tools output sanitization:
    - Convert TestRail HTML formatting (lists, paragraphs, links, typography, entity decoding) to clean Markdown/plaintext.
    - Normalize inline images to `[Attachment: <id>]` references.

## [2.5.0]

### Added
- Add `resolve_case_field` tool to resolve numeric reference IDs for Multi-select test case fields (`type_id: 12`) to their textual values for a specific project.

## [2.4.0]

### Added
- Add `get_case_history` tool to retrieve audit and change history for test cases.
- Add `TESTRAIL_ENABLE_CASE_HISTORY` environment variable (defaults to `false`) to conditionally register test case history tools and optimize LLM context window tokens.

## [2.3.0]

### Added
- Add `add_attachment` tool to upload files, screenshots, logs, or auto-zipped directories to test cases or test runs (`entity_type: "case" | "run"`), supporting both numeric and `'C123'` case IDs.
- Add `query_attachment` tool to download an attachment by ID (`action: "one"`) or retrieve attachment metadata for test cases or test runs (`action: "many"`), supporting pagination and optional `output_file` export.
- Extend `delete_entity` tool to support deleting attachments (`entity_type: "attachment"`) using numeric IDs.
- Add `TESTRAIL_ENABLE_DEPRECATED_TOOLS` environment variable (defaults to `true`) allowing users to preserve backward compatibility or disable deprecated tools to optimize prompt tokens.

### Deprecated
- Deprecated `add_attachment_to_run` in favor of the generic `add_attachment` tool (scheduled for removal in 3.0.0).

## [2.2.0]

### Added
- Add explicit boolean value guidance for Checkbox type to prevent the model from passing 0 or 1 values.
- Add multi-suite and baseline project support for section creation.

## [2.1.0]

### Added
- **Multi-Suite Project Support**: Added support for retrieving test cases and sections from projects that use multiple test suites. Users can now pass an optional `suite_id` parameter to the `get_cases` and `get_sections` tools.
- **Older TestRail API Support**: Improved backward compatibility to support paginating lists on older TestRail instances (pre-version 7.x).

## [2.0.0]

### Breaking
- **Tool Permission Restrictions**: Delete operations are now disabled by default for security. The `delete_entity` tool will no longer be registered unless `TESTRAIL_ALLOW_DELETE_OPERATIONS` is explicitly set to `true` in your environment.
- **Tool Replaced**: The `add_run` tool has been completely removed and replaced by `mutate_run`. Clients must now use `mutate_run` with a `payload` object specifying `action: "create"`.
- **Unified Deletion Tool**: The specific `delete_shared_step` tool has been **removed** and replaced by the unified `delete_entity` tool. AI assistants and clients must now use `delete_entity` with `entity_type: "shared_step"`.
- **Tool Consolidation & Unification**: The separate `get_project` and `get_projects` tools have been **removed** and replaced by a unified `query_project` tool. Clients and AI assistants must now use `query_project` with a `payload` specifying `action: "one"` or `action: "many"`.

### Added
- **Dynamic MCP Tool Annotations**: Automatically inject standard MCP annotations (`readOnlyHint`, `destructiveHint`, `idempotentHint`) to tools based on their interaction modes (`read`, `write`, `delete`).
- Introduce tool permission security controls (WRITE, READ, DELETE)
    - `TESTRAIL_ALLOW_WRITE_OPERATIONS` (default: `true`)
    - `TESTRAIL_ALLOW_READ_OPERATIONS` (default: `true`)
    - `TESTRAIL_ALLOW_DELETE_OPERATIONS` (default: `false`)
- Add `mutate_suite` tool to create or update test suites in a project
- Add `mutate_section` tool to create or update sections in a project
- Add `mutate_run` tool to create or update runs in a project
- Add unified `delete_entity` tool to delete supported TestRail entities (`case` or `shared_step`) by ID
- Add unified `query_suite` tool to retrieve a single test suite (`action: "one"`) or all test suites for a project (`action: "many"`)
- Add unified `query_run` tool to retrieve a single test run (`action: "one"`) or all test runs for a project (`action: "many"`, supporting suite/completion status filtering)
- Add unified `query_project` tool to retrieve a single project (`action: "one"`) or all active projects (`action: "many"`)
- Add `get_results` tool to retrieve paginated results for a specific test ID
- Add `get_configurations` tool to retrieve configuration groups and configuration matrix for a project

### Changed
- Allow creating test runs for entire suites by providing a suite ID (`suite_id`), eliminating the need to manually specify individual test case IDs.
- Clarify `fields` parameter description in `add_case`, `update_case`, and `update_cases` tools to explicitly state that field entries are merged into the root API request body

## [1.11.0]

### Added
- Add `get_users` tool allowing AI assistants to retrieve active TestRail users to streamline assignee or reviewer lookups

## [1.10.0]

### Added
- Add `output_file` parameter to `get_cases` and `get_sections` tools to allow directly saving large API responses to the local filesystem and bypassing LLM context window limits.

### Changed

- Bump `@modelcontextprotocol/sdk` from `1.27.1` to `1.29.0`
- Bump `dotenv` from `17.3.1` to `17.4.2`
- Bump `zod` from `4.3.6` to `4.4.3`

## [1.9.0]

### Added
- Add shared steps tools:
    - `get_shared_steps`
    - `get_shared_step`
    - `get_shared_step_history`
    - `add_shared_step`
    - `update_shared_step`
    - `delete_shared_step`
- Add `TESTRAIL_ENABLE_SHARED_STEPS` environment variable to toggle shared steps tools.

### Changed

- Improve fields selection guidance for `add_case`, `update_case`, and `update_cases` tools to prevent invalid fields in requests.
- Add `project_id` parameter to `get_case_fields` tool to return fields applicable to specific project.
- Rename `create_case` tool to `add_case` to follow TestRail API semantics.

## [1.8.0]

### Added

- Add `get_labels` tool

## [1.7.0]

### Added

- Add `get_priorities` tool
- Add `add_results_for_cases` tool

### Changed

- Bump `@modelcontextprotocol/sdk` from `1.25.3` to `1.27.1`
- Bump `@types/node` from `25.0.9` to `25.5.0`
- Bump `dotenv` from `17.2.3` to `17.3.1`
- Bump `jest` from `30.2.0` to `30.3.0`
- Bump `rimraf` from `6.1.2` to `6.1.3`
- Bump `zod` from `4.3.5` to `4.3.6`

## [1.6.1] - 2026-03-08

### Added

- Add server config for MCP Registry

## [1.6.0] - 2026-03-08

### Added

- Add requested fields validation against available schema
- Add paginated section fetching
- Improve validation of testrail config variables
- Add retry logic for network and API errors

## [1.5.0] - 2026-02-23

### Added

- Add logging for TestRail client requests

### Fixed

- Require non-empty case IDs in add_run and update_cases tools

## [1.4.0] - 2026-02-20

### Changed

- Extend get_cases tool to recursively fetch child section cases
- Optimize get_case response by removing non-essential fields from labels object
- Standardized ID parameter typing across MCP server from string to numeric types

## [1.3.1] - 2026-02-18

### Fixed

- Fix invalid config for distribution packaging

## [1.3.0] - 2026-02-18

### Added

- **Test run and result management tools**
    - `add_run` - Create a new test run in TestRail
    - `get_tests` - Get tests for a test run, optionally filtered by status
    - `add_results` - Add one or more test results to a test run
    - `get_statuses` - Get all available test statuses (e.g. Passed, Failed, Blocked)
- Add `add_attachment_to_run` tool to attach files to test runs

## [1.2.0] - 2026-02-14

### Changed

- Optimize MCP call responses by removing non-essential fields and nullish values
- Migrated from `axios` to native `fetch` API for reduced dependency footprint

## [1.1.0] - 2026-02-09

### Added

- **Configuration via environment variables**
    - `TESTRAIL_INSTANCE_URL` - Your TestRail instance URL
    - `TESTRAIL_USERNAME` - Your TestRail username
    - `TESTRAIL_API_KEY` - [How to get your API key](https://support.testrail.com/hc/en-us/articles/7077039051412-Accessing-the-TestRail-API)

- **Test case management tools**
    - `get_projects` - Discover available projects in your TestRail instance
    - `get_case` - Fetch detailed test case info including custom fields
    - `get_cases` - Query cases with filtering and pagination support
    - `get_case_fields` - Explore available fields and dropdown options
    - `get_templates` - List project templates to understand case structures
    - `get_sections` - Navigate the test case hierarchy
    - `add_case` - Create new test cases with full custom field support
    - `update_case` / `update_cases` - Modify single or bulk update cases
