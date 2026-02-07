import { z } from "zod";
import { TestRailClient } from "../client/testrail.js";
import { ToolDefinition, withErrorHandling } from "../types/custom.js";
import { Case } from "../types/testrail.js";

const parameters = {
    project_id: z.string().describe("The ID of the project"),
    section_id: z.string().optional().describe("Optional section ID to filter cases by section"),
    filter: z.record(z.string(), z.string()).optional().describe("Optional API filter parameters. Supported filters: priority_id (comma-separated IDs), type_id (comma-separated IDs), created_by (comma-separated user IDs), updated_by, milestone_id, refs, created_after, created_before, updated_after, updated_before. Example: {\"priority_id\": \"1,2\", \"type_id\": \"3\"}"),
    where: z.record(z.string(), z.any()).optional().describe("Optional client-side filter for any field including custom fields. Cases are filtered after fetching. Supports exact match for values. Example: {\"custom_automation_status\": 1, \"priority_id\": 2}"),
    fields: z.array(z.string()).optional().describe("Optional list of additional fields to include in the response. Use get_case_fields to see available field names. Example: [\"priority_id\", \"type_id\", \"custom_automation_status\"]"),
};

interface CasesResponse {
    cases: Record<string, any>[];
}

export const getCasesTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "get_cases",
    description: "Get all test cases for a project. Filter by section, API params (priority, type), or any field including custom fields via 'where'. Returns case IDs, titles, and any additional requested fields.",
    parameters,
    handler: withErrorHandling<typeof parameters, TestRailClient>(async ({ project_id, section_id, filter, where, fields }, client) => {
        let cases: Case[] = await client.getCases(project_id, section_id, filter);

        // Client-side filtering for custom fields and other unsupported API filters
        if (where) {
            cases = cases.filter(c => {
                for (const [key, value] of Object.entries(where)) {
                    const caseValue = (c as Record<string, any>)[key];
                    if (caseValue !== value) {
                        return false;
                    }
                }
                return true;
            });
        }

        const response: CasesResponse = {
            cases: cases.map(c => {
                const result: Record<string, any> = {
                    id: c.id,
                    title: c.title,
                    suite_id: c.suite_id,
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
