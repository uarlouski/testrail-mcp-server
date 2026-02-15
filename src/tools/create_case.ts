import { z } from "zod";
import { TestRailClient } from "../client/testrail.js";
import { ToolDefinition } from "../types/custom.js";

const parameters = {
    section_id: z.string().describe("The ID of the section where the case should be created. Use get_sections to find available sections"),
    title: z.string().describe("The title of the test case"),
    fields: z.record(z.string(), z.any()).optional().describe("Optional fields for the test case. First use get_templates to discover available templates, then get_case_fields to see available fields for your template. Example: {\"priority_id\": 2, \"template_id\": 1, \"custom_automation_priority\": 1}"),
};

export const createCaseTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "create_case",
    description: "Create a new test case in TestRail",
    parameters,
    handler: async ({ section_id, title, fields }, client) => {
        const caseData = {
            title,
            ...fields,
        };

        const createdCase = await client.createCase(section_id, caseData);

        return {
            success: true,
            case_id: createdCase.id,
            message: `Test case C${createdCase.id} created successfully`,
        };
    }
};
