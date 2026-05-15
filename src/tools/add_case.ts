import { z } from "zod";
import { TestRailClient } from "../client/testrail.js";
import { ToolDefinition } from "../types/custom.js";
import { validateCaseFields } from "../utils/validator.js";
import { CASE_FIELDS_PARAM_DESCRIPTION } from "./get_case_fields.js";

const parameters = {
    section_id: z.number().describe("The ID of the section where the case should be created. Use get_sections to find available sections"),
    title: z.string().describe("The title of the test case"),
    fields: z.record(z.string(), z.any()).optional().describe(CASE_FIELDS_PARAM_DESCRIPTION),
};

const description = `
Create a new test case in TestRail.
The create operation requires knowing valid field names that are returned by get_case_fields tool.
`;

export const addCaseTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "add_case",
    description: description.trim(),
    parameters,
    handler: async ({ section_id, title, fields }, client) => {
        if (fields) {
            validateCaseFields(fields, await client.getCaseFields());
        }

        const caseData = {
            title,
            ...fields,
        };
        const createdCase = await client.addCase(section_id, caseData);

        return {
            success: true,
            case_id: createdCase.id,
            message: `Test case C${createdCase.id} created successfully`,
        };
    }
};
