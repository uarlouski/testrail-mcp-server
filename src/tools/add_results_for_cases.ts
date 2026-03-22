import { TestRailClient } from "../client/testrail.js";
import { z } from "zod";
import { ResultSchema } from "../types/testrail.js";
import { ToolDefinition } from "../types/custom.js";

const parameters = {
    run_id: z.number().describe("The ID of the test run"),
    results: z.array(z.object({
        case_id: z.number().describe("The ID of the test case. Use get_cases with a project_id to retrieve available case IDs"),
        status_id: z.number().describe("The ID of the test status (e.g. Passed, Failed). Use get_statuses to retrieve available status IDs"),
        comment: z.string().optional().describe("Optional comment/description for the result"),
        defects: z.string().optional().describe("Optional comma-separated list of defect IDs"),
    })).describe("Array of results to add. Each result must have case_id and status_id"),
}

export const addResultsForCasesTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "add_results_for_cases",
    description: "Add one or more test results to a test run using case IDs instead of test IDs",
    parameters,
    handler: async ({ run_id, results }, client: TestRailClient) => {
        const response = await client.addResultsForCases(run_id, results);
        return {
            success: true,
            added_count: response.length,
            results: response.map(r => ResultSchema.parse(r)),
        };
    },
};
