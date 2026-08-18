# Shared Steps (Optional)

Tools for managing shared test steps across your project. 

> [!WARNING]
> This feature is gated by the `TESTRAIL_ENABLE_SHARED_STEPS=true` environment variable. If not enabled, these tools will not be registered or exposed to the LLM.

### `get_shared_steps`
List all shared test steps configured for a specific project. You can supply optional reference filtering to narrow down the results.

### `get_shared_step`
Retrieve precise details of a specific shared test step set by its ID.

### `get_shared_step_history`
View the complete audit trail and version history of a shared step set, useful for tracking when specific steps were changed and by whom.

### `add_shared_step`
Create a new reusable set of shared test steps that can be subsequently attached to multiple test cases.

### `update_shared_step`
Modify an existing shared step set. Note that updating shared steps will automatically propagate those changes to all linked test cases in TestRail.
