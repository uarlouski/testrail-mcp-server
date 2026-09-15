# Command Line Interface (CLI) & CI/CD Automation

The **TestRail MCP Server** package includes a built-in CLI adapter (`testrail-cli`) that allows executing any TestRail tool directly from shell scripts, terminal environments, and automated CI/CD pipelines without running an AI assistant or paying LLM token costs.

---

## 🌟 Why Use the CLI?

- **Deterministic Execution**: Returns standard Unix exit codes (`0` for success, `1` for validation or API error) to reliably control pipeline execution.
- **Pipeline-Native Output**: Outputs pure JSON to `stdout` for downstream parsing (e.g. using `jq`), while diagnostic messages and errors are written to `stderr`.
- **Zero Logic Duplication**: Reuses the exact same API client, exponential backoff retries, and strict Zod validation schemas as the MCP server.

---

## 🚀 Execution Methods

### 1. Direct `npx` Subcommand (Recommended)

When invoking on-demand in CI/CD environments without installing:

```bash
npx @uarlouski/testrail-mcp-server cli <command> [options]
```

### 2. Standalone Binary (`testrail-cli`)

If `@uarlouski/testrail-mcp-server` is installed as a development dependency in your project:

```bash
# In projects with the package installed:
npx testrail-cli <command> [options]
```

Or when linked globally on your machine:
```bash
# After running 'pnpm link --global' or 'npm link':
testrail-cli <command> [options]
```

---

## 🔐 Authentication & Environment Variables

The CLI reads the exact same credentials as the MCP server:

```bash
export TESTRAIL_INSTANCE_URL="https://example.testrail.io"
export TESTRAIL_USERNAME="qa-automation@example.com"
export TESTRAIL_API_KEY="your-api-key"
```

Alternatively, you can supply credentials dynamically as global flags:

```bash
npx @uarlouski/testrail-mcp-server cli <command> \
  --url "https://example.testrail.io" \
  --username "qa-automation@example.com" \
  --api-key "your-api-key" \
  [command-options]
```

---

## 📋 Flag Parsing & Rules

- **Primitives**: Numeric strings (`--project_id 1`) and booleans (`--verbose`, `--no-cache`) are automatically type-coerced to numbers and booleans.
- **Arrays**: Comma-separated strings are automatically split into arrays (e.g. `--case_ids 101,102,103` becomes `[101, 102, 103]`).
- **JSON Objects**: Inline JSON strings starting with `{` or `[` are automatically parsed as objects (e.g. `--where '{"custom_automation_status":1}'`).
- **Transparent Payload Auto-Wrapping**: For tools that use discriminated unions with a `payload` container (such as `query_project` or `mutate_run`), you can pass flat flags directly:
  ```bash
  # Automatically wraps into { payload: { action: "many" } }
  npx @uarlouski/testrail-mcp-server cli query_project --action many
  ```

---

## 📖 Command Recipes

### 1. `query_project`

#### Retrieve All Active Projects
```bash
npx @uarlouski/testrail-mcp-server cli query_project --action many
```

#### Retrieve a Single Project by ID
```bash
npx @uarlouski/testrail-mcp-server cli query_project --action one --project_id 1
```

Extracting values with `jq` in bash scripts:
```bash
PROJECT_NAME=$(npx @uarlouski/testrail-mcp-server cli query_project --action one --project_id 1 | jq -r .project.name)
echo "Project: $PROJECT_NAME"
```

---

### 2. `export_cases_for_rag`

Export test cases formatted as Markdown documents with companion `.md.metadata.json` sidecars for Knowledge Base and RAG ingestion.

#### Export All Cases for a Project
```bash
npx @uarlouski/testrail-mcp-server cli export_cases_for_rag \
  --project_id 1 \
  --output_dir ./rag_exports
```

#### Export Specific Test Cases by ID
```bash
npx @uarlouski/testrail-mcp-server cli export_cases_for_rag \
  --case_ids C101,C102,103 \
  --output_dir ./rag_exports
```

#### Export with Multi-Suite Scoping & Excluded Fields
```bash
npx @uarlouski/testrail-mcp-server cli export_cases_for_rag \
  --project_id 1 \
  --suite_id 2 \
  --ignored_fields custom_review_status,review_status \
  --output_dir ./rag_exports
```

---

## 🛠️ Command Discovery & Help

To view all available commands and their descriptions:
```bash
npx @uarlouski/testrail-mcp-server cli --help
```

To view parameter specifications, types, and descriptions for a specific tool:
```bash
npx @uarlouski/testrail-mcp-server cli query_project --help
npx @uarlouski/testrail-mcp-server cli export_cases_for_rag --help
```

---

## 🤖 CI/CD Workflow Example (GitHub Actions)

Below is an example GitHub Actions workflow that synchronizes TestRail cases to a Knowledge Base repository on a weekly schedule:

```yaml
name: Sync TestRail Knowledge Base

on:
  schedule:
    - cron: '0 2 * * 1' # Every Monday at 2 AM
  workflow_dispatch:

jobs:
  export-rag:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Export Test Cases for RAG
        env:
          TESTRAIL_INSTANCE_URL: ${{ secrets.TESTRAIL_INSTANCE_URL }}
          TESTRAIL_USERNAME: ${{ secrets.TESTRAIL_USERNAME }}
          TESTRAIL_API_KEY: ${{ secrets.TESTRAIL_API_KEY }}
          TESTRAIL_ENABLE_RAG_TOOLS: "true"
        run: |
          npx @uarlouski/testrail-mcp-server cli export_cases_for_rag \
            --project_id 1 \
            --output_dir ./knowledge-base/testrail

      - name: Commit and Push Updated Documents
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add knowledge-base/testrail
          if ! git diff-index --quiet HEAD; then
            git commit -m "chore(rag): sync testrail cases [skip ci]"
            git push
          fi
```
