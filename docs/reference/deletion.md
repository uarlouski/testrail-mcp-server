# Deletion

Tools for managing the permanent deletion of entities in TestRail.

> [!WARNING]
> Deletion operations are highly destructive and disabled by default. You must explicitly set `TESTRAIL_ALLOW_DELETE_OPERATIONS=true` in your server configuration to enable this tool.

### `delete_entity`
Deletes a specified TestRail entity by its ID. 
- You must supply the `entity_type` parameter (supporting `"case"`, `"shared_step"`, or `"attachment"`).
- You must supply the `entity_id` corresponding to that type.
- This operation is permanent and cannot be undone.
