import { z } from "zod";
import { TestRailClient } from "../client/testrail.js";
import { ToolDefinition } from "../types/custom.js";
import { Case } from "../types/testrail.js";

const parameters = {
    project_id: z.string().describe("The ID of the project. Use get_projects to find available projects"),
    section: z.object({
        id: z.string(),
        recursive: z.boolean().optional().default(false).describe("If true, fetches cases from the section and all its child sections"),
        excludes: z.array(z.string()).optional().describe("List of section names to exclude from the recursive search"),
    }).optional().describe("Section filter configuration. Use get_sections to find available sections"),
    filter: z.record(z.string(), z.string()).optional().describe("Optional API-side filters (more efficient for large datasets). Supported: priority_id, type_id, created_by, updated_by, milestone_id, refs, created_after, created_before, updated_after, updated_before. Use comma-separated values for IDs. Example: {\"priority_id\": \"1,2\", \"type_id\": \"3\"}"),
    where: z.record(z.string(), z.any()).optional().describe("Optional client-side filter for any field including custom fields (filters after fetching all cases). Supports exact value matching. Example: {\"custom_automation_status\": 1, \"priority_id\": 2}"),
    fields: z.array(z.string()).optional().describe("Additional fields to include in response beyond id, title, and suite_id. Use get_case_fields to see available fields. Example: [\"priority_id\", \"type_id\", \"custom_automation_status\"]"),
};

interface CasesResponse {
    cases: Record<string, any>[];
}

export const getCasesTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "get_cases",
    description: "Get all test cases for a project. Filter by section, API params (priority, type), or any field including custom fields via 'where'. Returns case IDs, titles, and any additional requested fields.",
    parameters,
    handler: async ({ project_id, section, filter, where, fields }, client) => {
        let cases: Case[];

        if (section?.recursive) {
            cases = await client.getCasesRecursively(project_id, section.id, filter, section.excludes);
        } else {
            cases = await client.getCases(project_id, section?.id, filter);
        }

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

        return response;
    }
};
