import { z } from "zod";
import { TestRailClient } from "../client/testrail.js";
import { ToolDefinition } from "../types/custom.js";
import { SectionSchema } from "../types/testrail.js";

const parameters = {
    project_id: z.string().describe("The ID of the project"),
};

export const getSectionsTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "get_sections",
    description: "Get all sections for a project. Returns section IDs and names. Use this to find the section_id needed for create_case.",
    parameters,
    handler: async ({ project_id }, client) => {
        const sections = await client.getSections(project_id);

        const response = {
            sections: sections.map(s => SectionSchema.parse(s)),
        };

        return response;
    }
};
