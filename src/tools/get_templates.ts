import { z } from "zod";
import { TestRailClient } from "../client/testrail.js";
import { ToolDefinition } from "../types/custom.js";
import { TemplateSchema } from "../types/testrail.js";

const parameters = {
    project_id: z.number().describe("The ID of the project. Use get_projects to find available projects"),
};

export const getTemplatesTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "get_templates",
    description: "Get available test case templates for a project. Template IDs determine which fields are available when creating or updating test cases",
    parameters,
    handler: async ({ project_id }, client) => {
        const templates = await client.getTemplates(project_id);

        return {
            templates: templates.map(t => TemplateSchema.parse(t)),
        };
    }
};
