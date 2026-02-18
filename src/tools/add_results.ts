import { TestRailClient } from "../client/testrail.js";
import { z } from "zod";
import { ResultSchema } from "../types/testrail.js";
import { ToolDefinition } from "../types/custom.js";

const parameters = {
    run_id: z.number().describe("The ID of the test run"),
    results: z.array(z.object({
        test_id: z.number().describe("The ID of the test. Use get_tests with a run_id to retrieve available test IDs"),
        status_id: z.number().describe("The ID of the test status (e.g. Passed, Failed). Use get_statuses to retrieve available status IDs"),
        comment: z.string().optional().describe("Optional comment/description for the result"),
        defects: z.string().optional().describe("Optional comma-separated list of defect IDs"),
    })).describe("Array of results to add. Each result must have test_id and status_id"),
}

export const addResultsTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "add_results",
    description: "Add one or more test results to a test run",
    parameters,
    handler: async ({ run_id, results }, client: TestRailClient) => {
        const response = await client.addResults(run_id, results);
        return {
            success: true,
            added_count: response.length,
            results: response.map(r => ResultSchema.parse(r)),
        };
    },
};
