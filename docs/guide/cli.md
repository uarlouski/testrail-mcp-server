---
title: CLI & CI/CD Automation
description: Use testrail-cli to run any TestRail MCP tool from bash, GitHub Actions, GitLab CI, or Jenkins — deterministic exit codes, JSON on stdout, no LLM cost.
faq: true
---

# TestRail CLI for scripts and CI/CD pipelines

The `@uarlouski/testrail-mcp-server` package ships a command line interface, **`testrail-cli`**, that exposes every TestRail tool as a shell command. It is the same server, the same API client, and the same validation schemas — just driven by flags instead of by a language model.

That makes it useful in two situations: automating TestRail from a CI/CD pipeline where no AI assistant is involved, and debugging a tool call by hand before wiring it into an assistant.

## Why use the CLI instead of the MCP server?

- **No LLM cost or latency.** Nothing is sent to a model. A command is a single authenticated HTTP call to TestRail.
- **Deterministic exit codes.** `0` on success and `1` on any validation or API error, so pipeline steps fail properly.
- **Pipeline-native output.** Pure JSON on `stdout` for piping into `jq`; every diagnostic and error goes to `stderr`.
- **No logic duplication.** The exponential-backoff retries, pagination handling, and strict Zod validation are shared with the MCP server, so behaviour cannot drift between the two.

> [!NOTE]
> The CLI exposes **all 34 tools**, including shared steps, case history, and the RAG export. The `TESTRAIL_ALLOW_*` permission toggles and `TESTRAIL_ENABLE_*` feature flags govern only what is registered with MCP clients; they do not restrict the CLI. In a pipeline, restrict access with the TestRail API key's own permissions instead.

## Installation and invocation

### Direct `npx` subcommand (recommended for CI)

Nothing to install — resolve and run it on demand:

```bash
npx @uarlouski/testrail-mcp-server cli <command> [options]
```

### Standalone binary

If the package is a dependency of your project:

```bash
npx testrail-cli <command> [options]
```

Or, after `npm link` / `pnpm link --global`:

```bash
testrail-cli <command> [options]
```

### Via the package runner

```bash
npx -p @uarlouski/testrail-mcp-server testrail-cli <command> [options]
```

## Authentication

The CLI reads the same three environment variables as the MCP server:

```bash
export TESTRAIL_INSTANCE_URL="https://example.testrail.io"
export TESTRAIL_USERNAME="qa-automation@example.com"
export TESTRAIL_API_KEY="your-api-key"
```

A `.env` file in the working directory is loaded automatically. Alternatively, pass credentials as global flags, which take precedence over the environment:

```bash
npx @uarlouski/testrail-mcp-server cli <command> \
  --url "https://example.testrail.io" \
  --username "qa-automation@example.com" \
  --api-key "your-api-key" \
  [command-options]
```

> [!WARNING]
> Flags are visible in process listings and shell history. In CI, prefer environment variables populated from your platform's secret store.

## Global flags

| Flag | Purpose |
| --- | --- |
| `--help` | List all commands, or show the flags for one command |
| `--version` | Print the CLI version |
| `--url` | Override `TESTRAIL_INSTANCE_URL` |
| `--username` | Override `TESTRAIL_USERNAME` |
| `--api-key` | Override `TESTRAIL_API_KEY` |

## How flags are parsed

Tool parameters map to flags directly, with automatic type coercion:

- **Primitives.** Numeric strings become numbers (`--project_id 1`), and bare flags become booleans (`--include_child`).
- **Arrays.** Comma-separated values are split (`--case_ids 101,102,103` becomes `[101, 102, 103]`).
- **JSON objects.** Values starting with `{` or `[` are parsed as JSON (`--where '{"custom_automation_status":1}'`).
- **Payload auto-wrapping.** Tools built on a discriminated union take a `payload` object. You can pass its fields as flat flags and the CLI wraps them for you:

  ```bash
  # Sent as { payload: { action: "many" } }
  npx @uarlouski/testrail-mcp-server cli query_project --action many
  ```

Validation errors name the offending parameter and exit with code `1` before any request is made.

## Command recipes

### List and inspect projects

```bash
# All active projects
npx @uarlouski/testrail-mcp-server cli query_project --action many

# A single project by ID
npx @uarlouski/testrail-mcp-server cli query_project --action one --project_id 1
```

Pull a single value out with `jq`:

```bash
PROJECT_NAME=$(npx @uarlouski/testrail-mcp-server cli query_project \
  --action one --project_id 1 | jq -r .project.name)
echo "Project: $PROJECT_NAME"
```

### Report automated test results

Submit results by `case_id`, which is what test frameworks usually know:

```bash
npx @uarlouski/testrail-mcp-server cli add_results_for_cases \
  --run_id 88 \
  --results '[{"case_id":1042,"status_id":1,"comment":"Passed in CI"},{"case_id":1043,"status_id":5,"comment":"Assertion failed"}]'
```

Status IDs vary per instance, so look them up rather than hard-coding them:

```bash
npx @uarlouski/testrail-mcp-server cli get_statuses | jq -r '.[] | "\(.id)\t\(.name)"'
```

### Create a test run for a release

```bash
RUN_ID=$(npx @uarlouski/testrail-mcp-server cli mutate_run \
  --action create \
  --project_id 1 \
  --name "Nightly regression $(date +%F)" \
  --case_ids 1042,1043,1044 | jq -r .run.id)

echo "Created run $RUN_ID"
```

You do not pass TestRail's `include_all` flag yourself. The server derives it: supplying `case_ids` limits the run to those cases, and omitting them includes every case in the suite. If you supply `case_ids` without a `suite_id`, the suite is resolved automatically from the first case.

### Attach a build artifact to a run

Directories are zipped automatically before upload:

```bash
npx @uarlouski/testrail-mcp-server cli add_attachment \
  --entity_type run \
  --entity_id 88 \
  --file_path ./test-results/screenshots
```

### Export test cases for a knowledge base or RAG pipeline

Each case is written as a Markdown document with a `.md.metadata.json` sidecar for vector-store filtering:

```bash
# Every case in a project
npx @uarlouski/testrail-mcp-server cli export_cases_for_rag \
  --project_id 1 \
  --output_dir ./rag_exports

# Specific cases, with or without the C prefix
npx @uarlouski/testrail-mcp-server cli export_cases_for_rag \
  --case_ids C101,C102,103 \
  --output_dir ./rag_exports

# Scoped to one suite, excluding internal fields
npx @uarlouski/testrail-mcp-server cli export_cases_for_rag \
  --project_id 1 \
  --suite_id 2 \
  --ignored_fields custom_review_status,review_status \
  --output_dir ./rag_exports
```

## Discovering commands

```bash
# Every available command
npx @uarlouski/testrail-mcp-server cli --help

# Parameters, types, and descriptions for one command
npx @uarlouski/testrail-mcp-server cli query_project --help
npx @uarlouski/testrail-mcp-server cli export_cases_for_rag --help
```

## CI/CD examples

### GitHub Actions: sync TestRail cases into a knowledge base

```yaml
name: Sync TestRail Knowledge Base

on:
  schedule:
    - cron: "0 2 * * 1" # Mondays at 02:00 UTC
  workflow_dispatch:

jobs:
  export-rag:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Export test cases for RAG
        env:
          TESTRAIL_INSTANCE_URL: ${{ secrets.TESTRAIL_INSTANCE_URL }}
          TESTRAIL_USERNAME: ${{ secrets.TESTRAIL_USERNAME }}
          TESTRAIL_API_KEY: ${{ secrets.TESTRAIL_API_KEY }}
        run: |
          npx @uarlouski/testrail-mcp-server cli export_cases_for_rag \
            --project_id 1 \
            --output_dir ./knowledge-base/testrail

      - name: Commit updated documents
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add knowledge-base/testrail
          if ! git diff-index --quiet HEAD; then
            git commit -m "chore(rag): sync testrail cases [skip ci]"
            git push
          fi
```

### GitHub Actions: publish results after a test job

```yaml
- name: Report results to TestRail
  if: always()
  env:
    TESTRAIL_INSTANCE_URL: ${{ secrets.TESTRAIL_INSTANCE_URL }}
    TESTRAIL_USERNAME: ${{ secrets.TESTRAIL_USERNAME }}
    TESTRAIL_API_KEY: ${{ secrets.TESTRAIL_API_KEY }}
  run: |
    npx @uarlouski/testrail-mcp-server cli add_results_for_cases \
      --run_id ${{ vars.TESTRAIL_RUN_ID }} \
      --results "$(cat testrail-results.json)"
```

### GitLab CI

```yaml
testrail:report:
  stage: report
  image: node:22
  when: always
  script:
    - npx @uarlouski/testrail-mcp-server cli add_results_for_cases
      --run_id "$TESTRAIL_RUN_ID"
      --results "$(cat testrail-results.json)"
  variables:
    TESTRAIL_INSTANCE_URL: $TESTRAIL_INSTANCE_URL
    TESTRAIL_USERNAME: $TESTRAIL_USERNAME
    TESTRAIL_API_KEY: $TESTRAIL_API_KEY
```

### Jenkins (declarative pipeline)

```groovy
stage('Report to TestRail') {
  environment {
    TESTRAIL_INSTANCE_URL = 'https://example.testrail.io'
    TESTRAIL_USERNAME     = credentials('testrail-username')
    TESTRAIL_API_KEY      = credentials('testrail-api-key')
  }
  steps {
    sh '''
      npx @uarlouski/testrail-mcp-server cli add_results_for_cases \
        --run_id "$TESTRAIL_RUN_ID" \
        --results "$(cat testrail-results.json)"
    '''
  }
}
```

## Frequently asked questions

### How do I report test results to TestRail from CI?

Use `add_results_for_cases` with the run ID and a JSON array of results keyed by `case_id`. Your test framework usually knows the case ID from an annotation or tag, so this avoids having to resolve TestRail's per-run `test_id` first. Look status IDs up with `get_statuses` rather than hard-coding them, since they are configurable per instance.

### Does the CLI respect the read, write, and delete permission variables?

No. The CLI registers every tool unconditionally; `TESTRAIL_ALLOW_WRITE_OPERATIONS`, `TESTRAIL_ALLOW_DELETE_OPERATIONS`, and the `TESTRAIL_ENABLE_*` feature flags only affect what the MCP server advertises to AI clients. To limit what a pipeline can do, restrict the TestRail user account whose API key you use.

### How do I parse the output in a shell script?

Successful commands print formatted JSON to `stdout` and nothing else, so you can pipe straight into `jq`. Diagnostics and errors go to `stderr`, which means `$(...)` capture stays clean. Check the exit code — `0` for success, `1` for any validation or API failure — before parsing.

### Can I use the CLI without installing anything?

Yes. `npx @uarlouski/testrail-mcp-server cli <command>` downloads and runs the package on demand, which is why it suits ephemeral CI runners. Pin a version such as `@2.10.0` in pipelines so a new release cannot change behaviour mid-sprint.

### What is the difference between `add_results` and `add_results_for_cases`?

`add_results` addresses results by `test_id`, the identifier of a case's instance inside a specific run. `add_results_for_cases` addresses them by `case_id`, the stable identifier of the case in the repository. Automation almost always wants the latter.
