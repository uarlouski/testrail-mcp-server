import { z } from "zod";
import { TestRailClient } from "../../client/testrail.js";
import { ToolDefinition } from "../../types/custom.js";
import { SharedStepHistorySchema } from "../../types/testrail.js";

const parameters = {
    shared_step_id: z.number().describe("The ID of the shared test step"),
};

export const getSharedStepHistoryTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "get_shared_step_history",
    mode: "read",
    description: "Returns the change history of a set of shared test steps.",
    parameters,
    handler: async (args, client) => {
        const { shared_step_id } = args;
        const history = await client.getSharedStepHistory(shared_step_id);
        return { history: history.map(h => SharedStepHistorySchema.parse(h)) };
    }
};
