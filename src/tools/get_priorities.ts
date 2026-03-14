import { TestRailClient } from "../client/testrail.js";
import { PrioritySchema } from "../types/testrail.js";
import { ToolDefinition } from "../types/custom.js";

const parameters = {};

export const getPrioritiesTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "get_priorities",
    description: "Get all available test case priorities (e.g. Critical, High, Medium, Low). Returns priority IDs and names that can be used when creating or updating test cases.",
    parameters,
    handler: async (_args: any, client: TestRailClient) => {
        const priorities = await client.getPriorities();
        return {
            priorities: priorities.map(p => PrioritySchema.parse(p)),
        };
    },
};
