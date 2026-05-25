# Changelog

## [Unreleased]

### Breaking
- **Tool Permission Restrictions**: Delete operations are now disabled by default for security. The `delete_shared_step` tool will no longer be registered unless `TESTRAIL_ALLOW_DELETE_OPERATIONS` is explicitly set to `true` in your environment.
- **Tool Replaced**: The `add_run` tool has been completely removed and replaced by `mutate_run`. Clients must now use `mutate_run` with a `payload` object specifying `action: "create"`.

### Added
- Introduce tool permission security controls (WRITE, READ, DELETE)
    - `TESTRAIL_ALLOW_WRITE_OPERATIONS` (default: `true`)
    - `TESTRAIL_ALLOW_READ_OPERATIONS` (default: `true`)
    - `TESTRAIL_ALLOW_DELETE_OPERATIONS` (default: `false`)
- Add `get_project` tool to allow AI assistants to retrieve a specific project by ID
- Add `mutate_section` tool to create or update sections in a project
- Add `mutate_run` tool to create or update runs in a project

### Changed
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
