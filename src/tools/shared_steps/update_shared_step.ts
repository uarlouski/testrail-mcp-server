import { z } from "zod";
import { TestRailClient } from "../../client/testrail.js";
import { ToolDefinition } from "../../types/custom.js";
import { SharedStepSchema } from "../../types/testrail.js";

const parameters = {
    shared_step_id: z.number().describe("The ID of the shared test step to update"),
    title: z.string().optional().describe("The updated title of the shared test step"),
    custom_steps_separated: z.array(z.object({
        content: z.string().describe("The step instruction"),
        expected: z.string().optional().describe("The expected result of the step"),
    })).optional().describe("The updated steps (replaces all existing steps)"),
};

const description = `
Updates an existing set of shared test steps.
Updates are propagated automatically to all test cases using these steps.
`;

export const updateSharedStepTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "update_shared_step",
    description: description.trim(),
    parameters,
    handler: async (args, client) => {
        const { shared_step_id, ...data } = args;
        const sharedStep = await client.updateSharedStep(shared_step_id, data);
        return { shared_step: SharedStepSchema.parse(sharedStep) };
    }
};
