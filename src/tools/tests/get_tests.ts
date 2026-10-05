import { TestRailClient } from "../../client/testrail.js";
import { z } from "zod";
import { Test } from "./types.js";
import { ToolDefinition } from "../../types/custom.js";

const parameters = {
    run_id: z.number().describe("The ID of the test run"),
    status_id: z.array(z.number()).optional().describe("Optional array of status IDs to filter by. Use get_statuses to retrieve available status IDs"),
};

export const getTestsTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "get_tests",
    mode: "read",
    deprecated: true,
    description: "Get tests for a test run, optionally filtered by status (Deprecated: use query_test with action 'many' instead)",
    parameters,
    handler: async ({ run_id, status_id }, client: TestRailClient) => {
        const tests: Test[] = await client.getTests(run_id, status_id);

        return {
            tests: tests.map(test => ({
                id: test.id,
                case_id: test.case_id,
                status_id: test.status_id,
                title: test.title,
                run_id: test.run_id,
            })),
        };
    },
};
