import { z } from "zod";
import { TestRailClient } from "../../client/testrail.js";
import { ToolDefinition } from "../../types/custom.js";
import { SharedStepSchema } from "../../types/testrail.js";

const parameters = {
    shared_step_id: z.number().describe("The ID of the shared test step"),
};

export const getSharedStepTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "get_shared_step",
    description: "Returns the details of a specific shared test step.",
    parameters,
    handler: async (args, client) => {
        const { shared_step_id } = args;
        const sharedStep = await client.getSharedStep(shared_step_id);
        return { shared_step: SharedStepSchema.parse(sharedStep) };
    }
};
