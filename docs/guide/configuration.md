# Configuration

This page details the environment variables required to securely configure the TestRail MCP Server.

| Variable | Description | Required | Default |
|----------|-------------|:--------:|:-------:|
| `TESTRAIL_INSTANCE_URL` | Your TestRail instance URL (e.g., `https://example.testrail.io`) | ✅ | |
| `TESTRAIL_USERNAME` | Your TestRail user email address | ✅ | |
| `TESTRAIL_API_KEY` | Your TestRail API key | ✅ | |
| `TESTRAIL_ENABLE_SHARED_STEPS` | Set to `true` to enable Shared Steps management tools | | `false` |
| `TESTRAIL_ENABLE_CASE_HISTORY` | Set to `true` to enable Case History and revision tracking tools | | `false` |
| `TESTRAIL_ALLOW_WRITE_OPERATIONS` | Allow write operations (e.g. adding/updating test cases) | | `true` |
| `TESTRAIL_ALLOW_READ_OPERATIONS` | Allow read operations (e.g. retrieving projects) | | `true` |
| `TESTRAIL_ALLOW_DELETE_OPERATIONS` | Allow delete operations (e.g. deleting cases). Enabled strictly via `true`. | | `false` |
| `TESTRAIL_ENABLE_DEPRECATED_TOOLS` | Enable deprecated tools for backward compatibility. Set to `false` to reduce context token overhead. | | `true` |

> [!TIP]
> **Token Tip**: If you are not using legacy tools, set `TESTRAIL_ENABLE_DEPRECATED_TOOLS=false` in your environment to eliminate deprecated tool definitions from the LLM prompt and save tokens!
