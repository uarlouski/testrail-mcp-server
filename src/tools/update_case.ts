import { z } from "zod";
import { TestRailClient } from "../client/testrail.js";
import { ToolDefinition } from "../types/custom.js";
import { validateCaseFields } from "../utils/validator.js";
import { CASE_FIELDS_PARAM_DESCRIPTION } from "./get_case_fields.js";

const parameters = {
    case_id: z.string().describe("The ID of the test case to update (e.g. '123' or 'C123')"),
    fields: z.record(z.string(), z.any()).describe(CASE_FIELDS_PARAM_DESCRIPTION),
};

const description = `
Update a test case in TestRail.
The update operation requires knowing valid field names that are returned by get_case_fields tool.
Supports partial updates — only specify the fields you want to change.
`;

export const updateCaseTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "update_case",
    mode: "update",
    description: description.trim(),
    parameters,
    handler: async ({ case_id, fields }, client) => {
        validateCaseFields(fields, await client.getCaseFields());

        const idString = case_id.toUpperCase().startsWith("C") ? case_id.substring(1) : case_id;
        const id = Number(idString);

        const updatedCase = await client.updateCase(id, fields);

        return {
            success: true,
            case_id: updatedCase.id,
            message: `Test case C${updatedCase.id} updated successfully`,
        };
    }
};
