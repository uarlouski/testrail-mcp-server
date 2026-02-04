import { z } from "zod";
import { TestRailClient } from "../client/testrail.js";
import { ToolDefinition, withErrorHandling } from "../types/custom.js";

const parameters = {
    project_id: z.string().describe("The ID of the project"),
};

interface SectionSchema {
    id: number;
    name: string;
}

interface SectionsResponse {
    sections: SectionSchema[];
}

export const getSectionsTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "get_sections",
    description: "Get all sections for a project. Returns section IDs and names. Use this to find the section_id needed for create_case.",
    parameters,
    handler: withErrorHandling<typeof parameters, TestRailClient>(async ({ project_id }, client) => {
        const sections = await client.getSections(project_id);

        const response: SectionsResponse = {
            sections: sections.map(s => ({
                id: s.id,
                name: s.name,
            })),
        };

        return {
            content: [
                {
                    type: "text" as const,
                    text: JSON.stringify(response, null, 2),
                },
            ],
        };
    })
};
