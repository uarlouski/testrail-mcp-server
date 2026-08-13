import { TestRailClient } from "../../client/testrail.js";
import { z } from "zod";
import * as fs from "fs";
import { AttachmentItemSchema, GetOneAttachmentSchema, GetManyAttachmentsSchema } from "./types.js";
import { ToolDefinition } from "../../types/custom.js";
import { normalizeEntityId } from "../../utils/attachment_helper.js";
import { handleQuery } from "../../utils/query_handler.js";

const parameters = {
    payload: z.discriminatedUnion("action", [
        GetOneAttachmentSchema,
        GetManyAttachmentsSchema,
    ]).describe("The payload containing the action ('one' or 'many') and corresponding parameters"),
};

export const queryAttachmentTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "query_attachment",
    mode: "read",
    description: "Download a single attachment or list all attachments for a test case or test run in TestRail. Set payload.action to 'one' or 'many' to specify the operation.",
    parameters,
    handler: async (args, client) => {
        return handleQuery(
            args.payload,
            async (p) => {
                const downloadResult = await client.getAttachment(p.attachment_id, p.output_file);
                return {
                    success: true,
                    message: `Successfully downloaded attachment ${p.attachment_id} (${downloadResult.size} bytes) to ${downloadResult.file}`,
                    file: downloadResult.file,
                    size: downloadResult.size,
                };
            },
            async (p) => {
                const normalizedId = normalizeEntityId(p.entity_id);
                const attachments = await client.getAttachments(p.entity_type, normalizedId);

                const parsedAttachments = attachments.map(item => AttachmentItemSchema.parse(item));
                const response = {
                    attachments: parsedAttachments,
                };

                if (p.output_file) {
                    await fs.promises.writeFile(p.output_file, JSON.stringify(response), "utf-8");
                    return {
                        success: true,
                        message: `Successfully exported ${response.attachments.length} attachments to ${p.output_file}`,
                        file: p.output_file,
                    };
                }

                return response;
            }
        );
    },
};
