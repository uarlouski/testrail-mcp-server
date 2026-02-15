import { TestRailClient } from "../client/testrail.js";
import { z } from "zod";
import { Test, TestSchema } from "../types/testrail.js";

export const getTestsTool = {
    name: "get_tests",
    description: "Get tests for a test run, optionally filtered by status",
    parameters: z.object({
        run_id: z.number().describe("The ID of the test run"),
        status_id: z.array(z.number()).optional().describe("Optional array of status IDs to filter by. Use get_statuses to retrieve available status IDs"),
    }),
    handler: async (args: any, client: TestRailClient) => {
        const tests: Test[] = await client.getTests(args.run_id, args.status_id);

        return {
            statuses: tests.map(test => TestSchema.parse(test)),
        };
    },
};
