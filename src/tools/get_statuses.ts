import { TestRailClient } from "../client/testrail.js";
import { z } from "zod";
import { StatusSchema } from "../types/testrail.js";
import { ToolDefinition } from "../types/custom.js";

const parameters = {};

export const getStatusesTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "get_statuses",
    description: "Get all available test statuses (e.g. Passed, Failed, Blocked). Returns status IDs and names that can be used with add_result and get_tests",
    parameters,
    handler: async (args: any, client: TestRailClient) => {
        const statuses = await client.getStatuses();
        return {
            statuses: statuses.map(s => StatusSchema.parse(s)),
        };
    },
};
