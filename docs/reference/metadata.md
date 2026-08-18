# System Metadata

Tools to retrieve system-level configuration and metadata. This ensures the AI model formats data exactly according to your instance's customized setup.

### `get_statuses`
Systematically list all configured test statuses (e.g., Passed, Failed, Blocked, Retest). The AI uses these IDs to map natural language results to your specific integer configurations.

### `get_priorities`
Retrieve priority levels configured within your instance structure, returning both their integer IDs and string names.

### `get_case_fields`
Discover custom field definitions, formats, and UI dropdown options. Supports filtering by `project_id`. This is critical for the `add_case` and `update_case` tools so the AI knows exactly what fields are required and what dropdown options map to which integer IDs.

### `get_templates`
Identify available case templates (e.g., Test Case (Text), Test Case (Steps)) to mandate correct AI structuring when drafting new test cases.

### `get_configurations`
Retrieve all configuration groups and configurations for a project. Used to specify environment details (like "Browser: Chrome", "OS: Windows") when setting up a test plan or run.
