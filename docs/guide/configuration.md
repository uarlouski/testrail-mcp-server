# Configuration

This page details the environment variables required to securely configure the TestRail MCP Server.

| Variable | Description | Required | Default |
|----------|-------------|:--------:|:-------:|
| `TESTRAIL_INSTANCE_URL` | Your TestRail instance URL (e.g., `https://example.testrail.io`) | ✅ | |
| `TESTRAIL_USERNAME` | Your TestRail user email address | ✅ | |
| `TESTRAIL_API_KEY` | Your TestRail API key | ✅ | |
| `TESTRAIL_ENABLE_SHARED_STEPS` | Set to `true` to enable Shared Steps management tools | | `false` |
| `TESTRAIL_ENABLE_CASE_HISTORY` | Set to `true` to enable Case History and revision tracking tools | | `false` |
| `TESTRAIL_ENABLE_RAG_TOOLS` | Set to `true` to enable experimental Knowledge Base / RAG export tools (`export_cases_for_rag`). Subject to breaking API changes. | | `false` |
| `TESTRAIL_ALLOW_WRITE_OPERATIONS` | Allow write operations (e.g. adding/updating test cases) | | `true` |
| `TESTRAIL_ALLOW_READ_OPERATIONS` | Allow read operations (e.g. retrieving projects) | | `true` |
| `TESTRAIL_ALLOW_DELETE_OPERATIONS` | Allow delete operations (e.g. deleting cases). Enabled strictly via `true`. | | `false` |
| `TESTRAIL_ENABLE_DEPRECATED_TOOLS` | Enable deprecated tools for backward compatibility. Set to `false` to reduce context token overhead. | | `true` |
| `TESTRAIL_DISABLED_TOOLS` | Comma-separated list of specific tool names to disable (e.g., `mutate_suite,delete_entity`). Fails on startup if invalid tool names are specified. | | |

---

## Disabling Specific Tools

Use `TESTRAIL_DISABLED_TOOLS` to exclude specific tools by name from being registered with the MCP server:

```bash
TESTRAIL_DISABLED_TOOLS=mutate_suite,mutate_section,query_attachment
```

### Why use `TESTRAIL_DISABLED_TOOLS`?

- **Token & Context Optimization**: Every registered tool injects its full JSON schema and description into the LLM's system prompt. Disabling tools you do not need significantly reduces prompt token overhead and preserves valuable context window space.
- **Fine-Grained Access Control (Least Privilege)**: High-level toggles like `TESTRAIL_ALLOW_WRITE_OPERATIONS` are all-or-nothing. `TESTRAIL_DISABLED_TOOLS` lets you allow routine tasks (such as `add_case` or `add_results_for_cases`) while blocking risky structural modifications (`mutate_suite`, `mutate_section`).
- **Agent Specialization & Reduced Hallucination**: When configuring specialized AI agents (e.g., automated result reporting bots in CI/CD or read-only QA assistants), providing only the essential tools keeps the model focused and prevents incorrect tool invocations.
- **Fail-Fast Validation**: If any misspelled or non-existent tool names are provided, the server will fail immediately on startup with an error listing the invalid tool names.

---

> [!TIP]
> **Token Tip**: If you are not using legacy tools, set `TESTRAIL_ENABLE_DEPRECATED_TOOLS=false` in your environment to eliminate deprecated tool definitions from the LLM prompt and save tokens!

