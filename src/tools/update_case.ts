import { z } from "zod";
import { TestRailClient } from "../client/testrail.js";
import { ToolDefinition, withErrorHandling } from "../types/custom.js";

const parameters = {
    case_id: z.string().describe("The ID of the test case to update (e.g. '123' or 'C123')"),
    fields: z.record(z.string(), z.any()).describe("Object containing fields to update. Use get_case_fields to see available fields. Example: {\"title\": \"New title\", \"priority_id\": 2, \"custom_automation_priority\": 1}"),
};

export const updateCaseTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "update_case",
    description: "Update a test case in TestRail. Supports partial updates - only specify the fields you want to change. Use get_case_fields to see available fields and their types.",
    parameters,
    handler: withErrorHandling<typeof parameters, TestRailClient>(async ({ case_id, fields }, client) => {
        const id = case_id.toUpperCase().startsWith("C") ? case_id.substring(1) : case_id;

        const updatedCase = await client.updateCase(id, fields);

        return {
            content: [
                {
                    type: "text" as const,
                    text: JSON.stringify({
                        success: true,
                        case_id: updatedCase.id,
                        message: `Test case C${updatedCase.id} updated successfully`,
                    }, null, 2),
                },
            ],
        };
    })
};
