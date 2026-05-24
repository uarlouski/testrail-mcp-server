import { z } from "zod";
import { TestRailClient } from "../../client/testrail.js";
import { ToolDefinition } from "../../types/custom.js";
import { SharedStepSchema } from "../../types/testrail.js";

const parameters = {
    project_id: z.number().describe("The ID of the project"),
    refs: z.string().optional().describe("Filter by a single Reference ID"),
};

export const getSharedStepsTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "get_shared_steps",
    mode: "read",
    description: "Returns a list of shared test steps for a specified project.",
    parameters,
    handler: async (args, client) => {
        const { project_id, refs } = args;
        const sharedSteps = await client.getSharedSteps(project_id, { refs });
        return { shared_steps: sharedSteps.map(s => SharedStepSchema.parse(s)) };
    }
};
