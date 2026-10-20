# Writing test cases that TestRail (and reviewers) accept

## Field payload shape

`add_case` takes `section_id`, `title`, and a **flat** `fields` map of `system_name → value`:

```json
{
  "section_id": 42,
  "title": "Password reset link expires after 24 hours",
  "fields": {
    "template_id": 2,
    "type_id": 1,
    "priority_id": 3,
    "refs": "AUTH-512",
    "custom_preconds": "A registered user with a verified email exists.",
    "custom_steps_separated": [
      { "content": "Request a password reset for the user.", "expected": "A reset email is delivered." },
      { "content": "Set the system clock forward 24h 1m and open the reset link.", "expected": "The page shows 'This link has expired' and no password form." },
      { "content": "Click 'Send a new link'.", "expected": "A new reset email is delivered and the old link stays invalid." }
    ]
  }
}
```

All IDs above are examples — resolve real ones with `get_case_fields`, `get_templates`,
`get_priorities`. Custom field names differ per instance (`custom_preconds`,
`custom_steps_separated`, `custom_automation_status` are common but not guaranteed).

## Template choice

| Neighbouring cases use… | Send |
| --- | --- |
| *Test Case (Steps)* | `custom_steps_separated` array of `{content, expected}` |
| *Test Case (Text)* | `custom_steps` and `custom_expected` as Markdown text |
| *Exploratory Session* | `custom_mission` and `custom_goals` |

Always confirm the field names against `get_case_fields` for that template.

## Title rules

- State the behaviour and the condition: *"Checkout rejects expired cards"*, not *"Checkout test 3"*.
- No "Verify that…", "Test…", or "Check…" prefixes unless the section already uses them.
- Keep under ~90 characters; push detail into preconditions and steps.

## Step rules

- One action per step; one observable outcome per expected result.
- Use concrete data (`user+reset@example.com`, `$0.00`, `24h 1m`), not "valid data".
- Expected results must be checkable by someone who did not write the case.
- Negative and boundary cases are separate cases, not extra steps in the happy path.

## Generating a set from a spec or ticket

1. Extract behaviours (one per acceptance criterion, plus obvious negatives/boundaries).
2. Present the list of proposed titles with priority, grouped by section. Wait for approval.
3. Create approved cases one by one with `add_case`; collect returned `C…` IDs.
4. Put the source ticket key in `refs` so coverage can be traced later
   (`get_cases` with `filter: { "refs": "AUTH-512" }`).
5. Finish with a table: `C-ID | title | priority | section`.

## Reviewing existing cases

When asked to review or clean up a section:

1. `get_cases` with `section: { id, recursive: true }` and `fields` for the attributes you need
   (use `output_file` if large).
2. Flag: duplicates/near-duplicates, vague titles, steps without expected results, missing
   required custom fields, stale cases (`updated_on` far older than related features).
3. Propose fixes as a diff per case. Apply with `update_case` (or `update_cases` for one shared
   change) only after approval.
