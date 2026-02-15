import { TestRailClient } from "../client/testrail.js";
import { z } from "zod";
import { ResultSchema } from "../types/testrail.js";

export const addResultsTool = {
    name: "add_results",
    description: "Add one or more test results to a test run",
    parameters: z.object({
        run_id: z.number().describe("The ID of the test run"),
        results: z.array(z.object({
            test_id: z.number().describe("The ID of the test. Use get_tests with a run_id to retrieve available test IDs"),
            status_id: z.number().describe("The ID of the test status (e.g. Passed, Failed). Use get_statuses to retrieve available status IDs"),
            comment: z.string().optional().describe("Optional comment/description for the result"),
            defects: z.string().optional().describe("Optional comma-separated list of defect IDs"),
        })).describe("Array of results to add. Each result must have test_id and status_id"),
    }),
    handler: async (args: any, client: TestRailClient) => {
        const results = await client.addResults(args.run_id, args.results);
        return {
            success: true,
            added_count: results.length,
            results: results.map(r => ResultSchema.parse(r)),
        };
    },
};
