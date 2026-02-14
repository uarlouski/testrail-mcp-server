# Changelog

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
    - `create_case` - Create new test cases with full custom field support
    - `update_case` / `update_cases` - Modify single or bulk update cases
