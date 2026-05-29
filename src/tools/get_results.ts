import { z } from "zod";
import { TestRailClient } from "../client/testrail.js";
import { ToolDefinition } from "../types/custom.js";
import { ResultSchema } from "../types/testrail.js";

const parameters = {
    test_id: z.number().int().describe("The ID of the test"),
};

export const getResultsTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "get_results",
    mode: "read",
    description: "Get results for a specific test in TestRail.",
    parameters,
    handler: async (args, client) => {
        const { test_id } = args;
        const results = await client.getResults(test_id);
        return {
            results: results.map(r => ResultSchema.parse(r)),
        };
    }
};
