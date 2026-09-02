# Discovery & Navigation

These tools are designed to help you navigate and explore the TestRail hierarchy, mapping out the available structure before diving deeper into specific cases or runs.

### `query_project`
Retrieves project information using a discriminated union action. This allows LLMs to either find a specific project or list all available projects using a single tool.
- **Action "one"**: Fetch detailed information for a single project by its `project_id`.
- **Action "many"**: Retrieve a list of all active projects in the TestRail instance.

### `query_suite`
Retrieves test suite information using a discriminated union action.
- **Action "one"**: Fetch detailed information for a single test suite by its `suite_id`.
- **Action "many"**: Retrieve a list of all test suites associated with a specific `project_id`.

### `mutate_suite`
Performs write modifications on test suites using a discriminated union action.
- **Action "create"**: Create a brand new test suite in a specified project.
- **Action "update"**: Modify an existing test suite (e.g., updating its name or description).

### `mutate_section`
Performs write modifications on sections (folders) using a discriminated union action.
- **Action "create"**: Create a new section within a specific project and suite. Supports `parent_id` for nested parent/child section relationships.
- **Action "update"**: Modify an existing section's name or description.

### `query_section`
Retrieves section information using a discriminated union action.
- **Action "one"**: Fetch detailed information for a single section by its `section_id`. Set `include_child: true` (along with `project_id` and optional `suite_id`) to retrieve the section as a recursive hierarchical tree with all its nested child sections.
- **Action "many"**: Retrieve sections for a `project_id` (and optional `suite_id`). Supports filtering by name via regex with `name_pattern` (e.g. `'auth.*'` or `'login|signup'`) and direct filesystem export via `output_file`.

### `get_sections`
> [!WARNING]
> **Deprecated**: Prefer using `query_section` with `action: "many"` instead.

Navigate the precise folder/section hierarchy of any test suite. This is highly useful for mapping out the exact location where test cases should be added or retrieved.

### `get_users`
Retrieve active users in your TestRail instance. You can optionally provide a `project_id` to filter users specific to a project.

> [!TIP]
> **Intelligent User Fallback**: When fetching users using `get_users` without admin rights, TestRail usually denies access globally. This MCP server dynamically catches this restriction and falls back to polling all active projects to fetch and deduplicate users, ensuring assignees can always be mapped.
