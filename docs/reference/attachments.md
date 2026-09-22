---
title: Attachment Tools
description: TestRail MCP tools for attachments — upload screenshots, logs, and whole directories to cases, runs, and results, with automatic zipping.
faq: true
---

# Attachment and media tools

These tools move files between your filesystem and TestRail: screenshots from a failed run, a log bundle, a trace directory. The useful detail is that you can hand them a **directory** as well as a file — the server zips it and uploads the archive, so an assistant does not have to shell out to a compression tool first.

| Tool | Mode | Purpose |
| --- | --- | --- |
| [`add_attachment`](#add-attachment) | `write` | Upload a file or directory to a case, run, or result |
| [`query_attachment`](#query-attachment) | `read` | Download one attachment, or list attachment metadata |

## `add_attachment`

Uploads an attachment to a TestRail entity.

**Parameters**

| Parameter | Description |
| --- | --- |
| `entity_type` | `"case"`, `"run"`, or `"result"` |
| `entity_id` | The target ID — `123` or `C123` for cases, numeric for runs and results |
| `file_path` | Path to a file **or a directory** |

**Directory support.** When `file_path` points to a directory, the server creates a temporary zip archive of its contents, uploads that, and deletes the temporary file afterwards — the cleanup runs in a `finally` block, so it happens even if the upload fails. A prompt like "attach the screenshots folder to run 88" therefore works without any manual archiving step.

One generic tool handles all three entity types rather than three near-identical tools, which keeps the model's prompt smaller and removes the chance of it picking the wrong variant.

## `query_attachment`

Retrieves attachments or their metadata.

- **`action: "one"`** — download an attachment's binary content to disk. Requires `attachment_id` and an `output_file` destination path.
- **`action: "many"`** — list attachment metadata (name, size, creation date) for a case or run, from `entity_type` and `entity_id`. Accepts `output_file` to write a long list to disk instead of into the model's context.

## Frequently asked questions

### Can I attach a whole folder of screenshots to a test run?

Yes. Pass the directory path as `file_path` and the server zips it before uploading, then removes the temporary archive. You do not need to compress anything yourself, and the cleanup is guaranteed even if the upload fails.

### What can attachments be attached to?

Test cases, test runs, and individual test results, selected with `entity_type`. Attaching to a result is the usual choice for CI evidence, since it ties the screenshot or log to the specific execution that produced it.

### How do I download an attachment from TestRail?

Call `query_attachment` with `action: "one"`, the `attachment_id`, and an `output_file` path. The binary content is written straight to that path rather than being passed through the model, which is what makes downloading large files practical. To discover the IDs first, call the same tool with `action: "many"` for a case or run.

### Can an AI assistant see the contents of an attachment?

Not through these tools. `query_attachment` writes the file to disk and reports where it went; it does not read the bytes into the conversation. If you want the assistant to analyse an image or log, download it first and then open it with whatever file or vision capability your client provides.
