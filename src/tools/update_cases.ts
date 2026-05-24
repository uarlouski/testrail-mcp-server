import { z } from "zod";
import { TestRailClient } from "../client/testrail.js";
import { ToolDefinition } from "../types/custom.js";
import { validateCaseFields } from "../utils/validator.js";
import { CASE_FIELDS_PARAM_DESCRIPTION } from "./get_case_fields.js";

const parameters = {
    case_ids: z.array(z.number()).min(1).describe("Array of case IDs to update (e.g. [123, 456, 789])"),
    fields: z.record(z.string(), z.any()).describe(CASE_FIELDS_PARAM_DESCRIPTION),
};

const description = `
Bulk update multiple test cases with the same field values.
The update operation requires knowing valid field names that are returned by get_case_fields tool.
More efficient than calling update_case multiple times.
`;

export const updateCasesTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "update_cases",
    mode: "update",
    description: description.trim(),
    parameters,
    handler: async ({ case_ids, fields }, client) => {
        validateCaseFields(fields, await client.getCaseFields());

        const caseData = await client.getCase(case_ids[0]);
        const updatedCases = await client.updateCases(caseData.suite_id, case_ids, fields);

        return {
            success: true,
            updated_count: updatedCases.length,
            case_ids: updatedCases.map(c => c.id),
            message: `Successfully updated ${updatedCases.length} test cases`,
        };
    }
};
