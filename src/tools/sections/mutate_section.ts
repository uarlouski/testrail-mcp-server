import { z } from "zod";
import { TestRailClient } from "../../client/testrail.js";
import { ToolDefinition } from "../../types/custom.js";
import { SectionSchema, CreateSectionSchema, UpdateSectionSchema } from "./types.js";
import { handleMutate } from "../../utils/mutate_handler.js";

const parameters = {
    payload: z.discriminatedUnion("action", [
        CreateSectionSchema,
        UpdateSectionSchema,
    ]).describe("The mutation payload containing the action (create or update) and the corresponding section attributes"),
};

export const mutateSectionTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "mutate_section",
    mode: "write",
    description: "Create a new section or update an existing section in TestRail. Set payload.action to 'create' or 'update' to specify the operation.",
    parameters,
    handler: async (args, client) => {
        const { payload } = args;
        return handleMutate(
            payload,
            async (createPayload) => {
                const { project_id, action, ...data } = createPayload;
                return client.addSection(project_id, data);
            },
            async (updatePayload) => {
                const { section_id, action, ...data } = updatePayload;
                return client.updateSection(section_id, data);
            },
            SectionSchema
        );
    }
};
