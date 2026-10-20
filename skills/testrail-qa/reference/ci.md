# Reporting from CI with `testrail-cli`

For pipelines, use the bundled CLI rather than an LLM. It runs the same tools with the same
validation, prints JSON to stdout, logs to stderr, and exits `1` on failure.

Credentials come from `TESTRAIL_INSTANCE_URL`, `TESTRAIL_USERNAME`, `TESTRAIL_API_KEY`
(store them as CI secrets).

## Look up status IDs once

```bash
npx @uarlouski/testrail-mcp-server cli get_statuses | jq -r '.[] | "\(.id)\t\(.name)"'
```

## Create a run for this build

```bash
RUN_ID=$(npx @uarlouski/testrail-mcp-server cli mutate_run \
  --action create \
  --project_id 1 \
  --name "Nightly regression $(date +%F)" \
  --case_ids 1042,1043,1044 | jq -r .run.id)
```

## Report results by case ID

```bash
npx @uarlouski/testrail-mcp-server cli add_results_for_cases \
  --run_id "$RUN_ID" \
  --results '[{"case_id":1042,"status_id":1,"comment":"Passed in CI"},{"case_id":1043,"status_id":5,"comment":"Assertion failed"}]'
```

## Attach artifacts to the run

```bash
npx @uarlouski/testrail-mcp-server cli add_attachment \
  --entity_type run --entity_id "$RUN_ID" --file_path ./test-results
```

Directories are zipped automatically.

## Helping the user wire this up

When asked to "send our test results to TestRail":

1. Find how tests reference case IDs (annotations, tags, or names like `C1042`). If they do not,
   propose a convention before writing any glue code.
2. Write a small script that parses the framework's report (JUnit XML, Playwright JSON, etc.)
   into the `results` array above, mapping outcomes to status IDs by name.
3. Add the three CLI steps to the pipeline, guarded so a TestRail outage does not fail the build
   unless the user wants it to.
