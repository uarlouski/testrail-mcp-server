import { z } from "zod";
import { TestRailClient } from "../../client/testrail.js";
import { ToolDefinition } from "../../types/custom.js";
import { SuiteSchema, CreateSuiteSchema, UpdateSuiteSchema } from "./types.js";

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

        if (payload.action === "create") {
            const { project_id, action, ...data } = payload;
            const suite = await client.addSuite(project_id, data);
            return SuiteSchema.parse(suite);
        } else if (payload.action === "update") {
            const { suite_id, action, ...data } = payload;
            const suite = await client.updateSuite(suite_id, data);
            return SuiteSchema.parse(suite);
        } else {
            const unknownAction = (payload as any).action;
            throw new Error(`Unsupported mutation action: ${unknownAction}`);
        }
    }
};
