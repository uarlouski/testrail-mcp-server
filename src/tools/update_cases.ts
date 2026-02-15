import { z } from "zod";
import { TestRailClient } from "../client/testrail.js";
import { ToolDefinition } from "../types/custom.js";

const parameters = {
    case_ids: z.array(z.number()).describe("Array of case IDs to update (e.g. [123, 456, 789])"),
    fields: z.record(z.string(), z.any()).describe("Object containing fields to update for ALL specified cases. Use get_case_fields to see available fields. Example: {\"priority_id\": 2, \"type_id\": 1}"),
};

export const updateCasesTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "update_cases",
    description: "Bulk update multiple test cases with the same field values. More efficient than calling update_case multiple times",
    parameters,
    handler: async ({ case_ids, fields }, client) => {
        const caseData = await client.getCase(String(case_ids[0]));
        const updatedCases = await client.updateCases(caseData.suite_id, case_ids, fields);

        return {
            success: true,
            updated_count: updatedCases.length,
            case_ids: updatedCases.map(c => c.id),
            message: `Successfully updated ${updatedCases.length} test cases`,
        };
    }
};
