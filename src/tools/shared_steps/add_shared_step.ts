import { z } from "zod";
import { TestRailClient } from "../../client/testrail.js";
import { ToolDefinition } from "../../types/custom.js";
import { SharedStepSchema } from "../../types/testrail.js";

const parameters = {
    project_id: z.number().describe("The ID of the project where the shared step will be created"),
    title: z.string().describe("The title of the shared test step"),
    custom_steps_separated: z.array(z.object({
        content: z.string().describe("The step instruction"),
        expected: z.string().optional().describe("The expected result of the step"),
    })).optional().describe("The steps of the shared test step"),
};

export const addSharedStepTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "add_shared_step",
    description: "Creates a new set of shared test steps.",
    parameters,
    handler: async (args, client) => {
        const { project_id, ...data } = args;
        const sharedStep = await client.addSharedStep(project_id, data);
        return { shared_step: SharedStepSchema.parse(sharedStep) };
    }
};
