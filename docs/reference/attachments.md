# Attachments & Media

Tools for attaching files (like screenshots and logs) to your TestRail instances.

### `add_attachment`
Upload an attachment to a specific TestRail entity. 
- You specify the `entity_type` (either `"case"` or `"run"`).
- You provide the `entity_id` and the local `file_path`.
- **Directory Support**: If the provided `file_path` points to a directory instead of a single file, the MCP server will automatically zip the entire directory into an archive and upload it for you.

### `query_attachment`
Retrieves attachment information using a discriminated union action.
- **Action "one"**: Download the actual binary file of a specific attachment to your local file system. Provide the `attachment_id` and the destination `output_file` path.
- **Action "many"**: Retrieve metadata (name, size, creation date) for all attachments associated with a specific case or run.
