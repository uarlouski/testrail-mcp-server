import { z } from "zod";
import { TestRailClient } from "../client/testrail.js";
import { ToolDefinition, withErrorHandling } from "../types/custom.js";
import { Case } from "../types/testrail.js";

const parameters = {
    project_id: z.string().describe("The ID of the project"),
    section_id: z.string().optional().describe("Optional section ID to filter cases by section"),
    fields: z.array(z.string()).optional().describe("Optional list of additional fields to include in the response. Use get_case_fields to see available field names. Example: [\"priority_id\", \"type_id\", \"custom_automation_status\"]"),
};

interface CasesResponse {
    cases: Record<string, any>[];
}

export const getCasesTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "get_cases",
    description: "Get all test cases for a project. Optionally filter by section. Returns case IDs, titles, and any additional requested fields. Use get_case with a specific ID to get full case details.",
    parameters,
    handler: withErrorHandling<typeof parameters, TestRailClient>(async ({ project_id, section_id, fields }, client) => {
        const cases: Case[] = await client.getCases(project_id, section_id);

        const response: CasesResponse = {
            cases: cases.map(c => {
                const result: Record<string, any> = {
                    id: c.id,
                    title: c.title,
                };

                if (fields) {
                    for (const field of fields) {
                        if (field in c) {
                            result[field] = c[field];
                        }
                    }
                }

                return result;
            }),
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
