import { z } from "zod";
import { TestRailClient } from "../client/testrail.js";
import { ToolDefinition } from "../types/custom.js";
import { TemplateSchema } from "../types/testrail.js";

const parameters = {
    project_id: z.string().describe("The ID of the project"),
};

export const getTemplatesTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "get_templates",
    description: "Get available test case templates for a project. Returns template IDs and names. Use template IDs with get_case_fields to understand which fields apply to each template.",
    parameters,
    handler: async ({ project_id }, client) => {
        const templates = await client.getTemplates(project_id);

        const response = {
            templates: templates.map(t => TemplateSchema.parse(t)),
        };

        return response;
    }
};
