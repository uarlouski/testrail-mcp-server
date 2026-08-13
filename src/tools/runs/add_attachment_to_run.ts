import { TestRailClient } from "../../client/testrail.js";
import { z } from "zod";
import { AttachmentSchema } from "../attachments/types.js";
import { ToolDefinition } from "../../types/custom.js";
import { prepareUploadFile } from "../../utils/attachment_helper.js";

const parameters = {
    run_id: z.number().describe("The ID of the test run to attach the file to"),
    file_path: z.string().describe("The path to the file or directory to attach. Directories will be automatically zipped."),
};

/**
 * @deprecated Use `add_attachment` tool from the attachments domain instead.
 */
export const addAttachmentToRunTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "add_attachment_to_run",
    mode: "write",
    description: "Add an attachment to a test run in TestRail. (Deprecated: Prefer add_attachment tool). Maximum upload size is 256MB.",
    parameters,
    handler: async ({ run_id, file_path }, client: TestRailClient) => {
        return prepareUploadFile(file_path, async (uploadPath, filename) => {
            const result = await client.addAttachment('run', run_id, uploadPath, filename);
            return AttachmentSchema.parse(result);
        });
    },
};
