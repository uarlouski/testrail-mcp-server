import { z } from "zod";
import { TestRailClient } from "../../client/testrail.js";
import { ToolDefinition } from "../../types/custom.js";
import { SectionSchema } from "../../types/testrail.js";

const parameters = {
    project_id: z.number().describe("The ID of the project the section should be added to"),
    name: z.string().describe("The name of the section"),
    description: z.string().optional().describe("The description of the section"),
    parent_id: z.number().optional().describe("The ID of the parent section (to build section hierarchies)"),
};

export const addSectionTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "add_section",
    mode: "create",
    description: "Create a new section for a project",
    parameters,
    handler: async (args, client) => {
        const { project_id, ...data } = args;
        const section = await client.addSection(project_id, data);
        return SectionSchema.parse(section);
    }
};
