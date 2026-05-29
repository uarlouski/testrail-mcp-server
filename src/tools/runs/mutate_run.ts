import { z } from "zod";
import { TestRailClient } from "../../client/testrail.js";
import { ToolDefinition } from "../../types/custom.js";
import { RunSchema } from "../../types/testrail.js";

const BaseRunFields = z.object({
    name: z.string().optional().describe("The name of the test run"),
    description: z.string().optional().describe("The description of the test run"),
    case_ids: z.array(z.number()).optional().describe("An array of case IDs for the custom case selection"),
});

const CreateRunSchema = BaseRunFields.extend({
    action: z.literal("create").describe("The operation to perform: create a new test run"),
    project_id: z.number().describe("The ID of the project the test run should be added to"),
    suite_id: z.number().optional().describe("The ID of the test suite for the test run"),
    case_ids: z.array(z.number()).optional().describe("Array of case IDs to include in the run. If provided, the run will only include these cases; otherwise, all cases will be included."),
});

const UpdateRunSchema = BaseRunFields.extend({
    action: z.literal("update").describe("The operation to perform: update an existing test run"),
    run_id: z.number().describe("The ID of the test run to update"),
});

const parameters = {
    payload: z.discriminatedUnion("action", [
        CreateRunSchema,
        UpdateRunSchema,
    ]).describe("The mutation payload containing the action (create or update) and the corresponding run attributes"),
};

export const mutateRunTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "mutate_run",
    mode: "write",
    description: "Create a new test run or update an existing one in TestRail. Set payload.action to 'create' or 'update' to specify the operation.",
    parameters,
    handler: async (args, client) => {
        const { payload } = args;

        if (payload.action === "create") {
            const { project_id, action, ...data } = payload;
            
            const params: Record<string, any> = { ...data };

            if (!params.suite_id && params.case_ids && params.case_ids.length > 0) {
                // Determine suite_id automatically from the first case
                const caseData = await client.getCase(params.case_ids[0]);
                params.suite_id = caseData.suite_id;
                params.include_all = false;
            } else if (params.suite_id) {
                // suite_id provided
                params.include_all = !params.case_ids || params.case_ids.length === 0;
            } else {
                // Neither suite_id nor case_ids provided (e.g. single-suite project)
                params.include_all = true;
            }
            
            const run = await client.addRun(project_id, params);
            return RunSchema.parse(run);
        } else if (payload.action === "update") {
            const { run_id, action, ...data } = payload;
            const run = await client.updateRun(run_id, data);
            return RunSchema.parse(run);
        } else {
            const unknownAction = (payload as any).action;
            throw new Error(`Unsupported mutation action: ${unknownAction}`);
        }
    }
};
