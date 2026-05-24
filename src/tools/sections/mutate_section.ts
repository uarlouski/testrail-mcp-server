import { z } from "zod";
import { TestRailClient } from "../../client/testrail.js";
import { ToolDefinition } from "../../types/custom.js";
import { SectionSchema } from "../../types/testrail.js";

const BaseSectionFields = z.object({
    name: z.string().describe("The name of the section"),
    description: z.string().optional().describe("The description of the section"),
});

const CreateSectionSchema = BaseSectionFields.extend({
    action: z.literal("create").describe("The operation to perform: create a new section"),
    project_id: z.number().describe("The ID of the project the section should be added to"),
    parent_id: z.number().optional().describe("The ID of the parent section (to build section hierarchies)"),
});

const UpdateSectionSchema = BaseSectionFields.partial().extend({
    action: z.literal("update").describe("The operation to perform: update an existing section"),
    section_id: z.number().describe("The ID of the section to update"),
});

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
        } else {
            const { section_id, action, ...data } = payload;
            const section = await client.updateSection(section_id, data);
            return SectionSchema.parse(section);
        }
    }
};
