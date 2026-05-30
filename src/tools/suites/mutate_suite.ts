import { z } from "zod";
import { TestRailClient } from "../../client/testrail.js";
import { ToolDefinition } from "../../types/custom.js";
import { SuiteSchema, CreateSuiteSchema, UpdateSuiteSchema } from "./types.js";
import { handleMutate } from "../../utils/mutate_handler.js";

const parameters = {
    payload: z.discriminatedUnion("action", [
        CreateSuiteSchema,
        UpdateSuiteSchema,
    ]).describe("The mutation payload containing the action (create or update) and the corresponding suite attributes"),
};

export const mutateSuiteTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "mutate_suite",
    mode: "write",
    description: "Create a new test suite or update an existing one in TestRail. Set payload.action to 'create' or 'update' to specify the operation.",
    parameters,
    handler: async (args, client) => {
        const { payload } = args;

        return handleMutate(
            payload,
            async (createPayload) => {
                const { project_id, action, ...data } = createPayload;
                return client.addSuite(project_id, data);
            },
            async (updatePayload) => {
                const { suite_id, action, ...data } = updatePayload;
                return client.updateSuite(suite_id, data);
            },
            SuiteSchema
        );
    }
};
