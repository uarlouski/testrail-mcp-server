import { z } from "zod";
import { TestRailClient } from "../../client/testrail.js";
import { ToolDefinition } from "../../types/custom.js";
import { SectionSchema, CreateSectionSchema, UpdateSectionSchema } from "./types.js";

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
        if (payload.action === "create") {
            const { project_id, action, ...data } = payload;
            const section = await client.addSection(project_id, data);
            return SectionSchema.parse(section);
        } else if (payload.action === "update") {
            const { section_id, action, ...data } = payload;
            const section = await client.updateSection(section_id, data);
            return SectionSchema.parse(section);
        } else {
            const unknownAction = (payload as any).action;
            throw new Error(`Unsupported mutation action: ${unknownAction}`);
        }
    }
};
