import { z } from "zod";
import { TestRailClient } from "../../client/testrail.js";
import { ToolDefinition } from "../../types/custom.js";

const parameters = {
    shared_step_id: z.number().describe("The ID of the shared test step to delete"),
};

const description = `
Deletes an existing shared step entity.
By default, this removes the shared step entity but keeps the steps in the test cases that used them.
`;

export const deleteSharedStepTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "delete_shared_step",
    mode: "delete",
    description: description.trim(),
    parameters,
    handler: async (args, client) => {
        const { shared_step_id } = args;
        await client.deleteSharedStep(shared_step_id);
        return { message: `Shared step ${shared_step_id} deleted successfully.` };
    }
};
