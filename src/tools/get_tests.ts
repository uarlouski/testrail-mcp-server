import { TestRailClient } from "../client/testrail.js";
import { z } from "zod";
import { Test, TestSchema } from "../types/testrail.js";
import { ToolDefinition } from "../types/custom.js";

const parameters = {
    run_id: z.number().describe("The ID of the test run"),
    status_id: z.array(z.number()).optional().describe("Optional array of status IDs to filter by. Use get_statuses to retrieve available status IDs"),
}

export const getTestsTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "get_tests",
    description: "Get tests for a test run, optionally filtered by status",
    parameters,
    handler: async ({ run_id, status_id }, client: TestRailClient) => {
        const tests: Test[] = await client.getTests(run_id, status_id);

        return {
            tests: tests.map(test => TestSchema.parse(test)),
        };
    },
};
