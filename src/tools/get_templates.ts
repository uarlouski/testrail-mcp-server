import { z } from "zod";
import { TestRailClient } from "../client/testrail.js";
import { ToolDefinition, withErrorHandling } from "../types/custom.js";

const parameters = {
    project_id: z.string().describe("The ID of the project"),
};

interface TemplateSchema {
    id: number;
    name: string;
}

interface TemplatesResponse {
    templates: TemplateSchema[];
}

export const getTemplatesTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "get_templates",
    description: "Get available test case templates for a project. Returns template IDs and names. Use template IDs with get_case_fields to understand which fields apply to each template.",
    parameters,
    handler: withErrorHandling<typeof parameters, TestRailClient>(async ({ project_id }, client) => {
        const templates = await client.getTemplates(project_id);

        const response: TemplatesResponse = {
            templates: templates.map(t => ({
                id: t.id,
                name: t.name,
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
