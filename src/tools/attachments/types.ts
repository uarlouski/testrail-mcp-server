import { z } from "zod";

export type AttachmentEntityType = "case" | "run";

export const AttachmentSchema = z.object({
    attachment_id: z.union([z.number(), z.string()]),
});

export type Attachment = z.infer<typeof AttachmentSchema>;

export const AttachmentItemSchema = z.object({
    id: z.union([z.number(), z.string()]),
    filename: z.string().optional(),
    size: z.number().optional(),
    file_type: z.string().optional(),
    is_image: z.union([z.boolean(), z.number()]).optional(),
});

export type AttachmentItem = z.infer<typeof AttachmentItemSchema>;

export const AddAttachmentSchema = z.object({
    entity_type: z.enum(["case", "run"]).describe("The type of entity to attach the file to ('case' or 'run')"),
    entity_id: z.union([z.number(), z.string()]).describe("The ID of the entity to attach the file to (e.g. 123 or 'C123' for cases, or numeric run ID)"),
    file_path: z.string().describe("The path to the file or directory to attach. Directories will be automatically zipped."),
});

export const GetOneAttachmentSchema = z.object({
    action: z.literal("one").describe("Download a single attachment by ID and save to local filesystem"),
    attachment_id: z.union([z.number(), z.string()]).describe("The ID of the attachment to download (numeric ID or UUID)"),
    output_file: z.string().describe("Absolute local file path where the downloaded attachment will be saved"),
});

export const GetManyAttachmentsSchema = z.object({
    action: z.literal("many").describe("Retrieve attachment metadata for a test case or test run"),
    entity_type: z.enum(["case", "run"]).describe("The type of entity to get attachments for ('case' or 'run')"),
    entity_id: z.union([z.number(), z.string()]).describe("The ID of the entity (e.g. 123 or 'C123' for cases, or numeric run ID)"),
    output_file: z.string().optional().describe("Optional absolute file path to export large metadata JSON responses"),
});
