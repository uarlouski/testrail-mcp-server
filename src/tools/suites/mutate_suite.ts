import { z } from "zod";
import { TestRailClient } from "../../client/testrail.js";
import { ToolDefinition } from "../../types/custom.js";
import { SuiteSchema } from "../../types/testrail.js";

const BaseSuiteFields = z.object({
    name: z.string().describe("The name of the test suite"),
    description: z.string().optional().describe("The description of the test suite"),
});

const CreateSuiteSchema = BaseSuiteFields.extend({
    action: z.literal("create").describe("The operation to perform: create a new test suite"),
    project_id: z.number().describe("The ID of the project the test suite should be added to"),
});

const UpdateSuiteSchema = BaseSuiteFields.partial().extend({
    action: z.literal("update").describe("The operation to perform: update an existing test suite"),
    suite_id: z.number().describe("The ID of the test suite to update"),
});

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
