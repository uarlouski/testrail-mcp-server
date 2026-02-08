import { z } from "zod";
import { TestRailClient } from "../client/testrail.js";
import { ToolDefinition, withErrorHandling } from "../types/custom.js";

const parameters = {
    section_id: z.string().describe("The ID of the section where the case should be created"),
    title: z.string().describe("The title of the test case (required)"),
    fields: z.record(z.string(), z.any()).optional().describe("Optional object containing additional fields. Use get_case_fields to see available fields. Example: {\"priority_id\": 2, \"template_id\": 1, \"custom_automation_priority\": 1}"),
};

export const createCaseTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "create_case",
    description: "Create a new test case in TestRail. IMPORTANT: Before creating a case, first call get_templates to discover available templates for the project, then use get_case_fields to see which fields are available for the chosen template. Requires section_id and title.",
    parameters,
    handler: withErrorHandling<typeof parameters, TestRailClient>(async ({ section_id, title, fields }, client) => {
        const caseData = {
            title,
            ...fields,
        };

        const createdCase = await client.createCase(section_id, caseData);

        return {
            content: [
                {
                    type: "text" as const,
                    text: JSON.stringify({
                        success: true,
                        case_id: createdCase.id,
                        message: `Test case C${createdCase.id} created successfully`,
                    }, null, 2),
                },
            ],
        };
    })
};
