import { TestRailClient } from "../../client/testrail.js";
import { z } from "zod";
import { AttachmentSchema } from "./types.js";
import { ToolDefinition } from "../../types/custom.js";
import { normalizeEntityId, prepareUploadFile } from "../../utils/attachment_helper.js";

const parameters = {
    entity_type: z.enum(["case", "run"]).describe("The type of entity to attach the file to ('case' or 'run')"),
    entity_id: z.union([z.number(), z.string()]).describe("The ID of the entity to attach the file to (e.g. 123 or 'C123' for cases, or numeric run ID)"),
    file_path: z.string().describe("The path to the file or directory to attach. Directories will be automatically zipped."),
};

const description = `
Add an attachment to a test case or test run in TestRail.
If the file_path points to a directory, it will be automatically zipped before uploading.
Maximum upload size is 256MB.
`;

export const addAttachmentTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "add_attachment",
    mode: "write",
    description: description.trim(),
    parameters,
    handler: async ({ entity_type, entity_id, file_path }, client: TestRailClient) => {
        const normalizedId = normalizeEntityId(entity_id);

        return prepareUploadFile(file_path, async (uploadPath, filename) => {
            const result = await client.addAttachment(entity_type, normalizedId, uploadPath, filename);
            return AttachmentSchema.parse(result);
        });
    },
};
