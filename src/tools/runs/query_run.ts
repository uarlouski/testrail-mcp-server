import { z } from "zod";
import { TestRailClient } from "../../client/testrail.js";
import { ToolDefinition } from "../../types/custom.js";
import { RunSchema } from "../../types/testrail.js";
import { handleQuery } from "../../utils/query_handler.js";

const GetOneRunSchema = z.object({
    action: z.literal("one").describe("Retrieve a single test run by ID"),
    run_id: z.number().int().describe("The ID of the test run"),
});

const GetManyRunsSchema = z.object({
    action: z.literal("many").describe("Retrieve all test runs for a project"),
    project_id: z.number().int().describe("The ID of the project"),
    suite_id: z.number().int().optional().describe("Filter by suite ID"),
    is_completed: z.number().int().min(0).max(1).optional().describe("Filter by completion status (1 for completed, 0 for active)"),
});

const parameters = {
    payload: z.discriminatedUnion("action", [
        GetOneRunSchema,
        GetManyRunsSchema,
    ]).describe("The payload containing the action ('one' or 'many') and corresponding parameters"),
};

export const queryRunTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "query_run",
    mode: "read",
    description: "Retrieve a single test run or all test runs for a project in TestRail. Set payload.action to 'one' or 'many' to specify the operation.",
    parameters,
    handler: async (args, client) => {
        return handleQuery(
            args.payload,
            async (p) => {
                const run = await client.getRun(p.run_id);
                return {
                    run: RunSchema.parse(run),
                };
            },
            async (p) => {
                const { project_id, action, ...filters } = p;
                const cleanFilters: Record<string, string> = {};
                for (const [key, value] of Object.entries(filters)) {
                    if (value !== undefined && value !== null) {
                        cleanFilters[key] = value.toString();
                    }
                }
                const runs = await client.getRuns(project_id, cleanFilters);
                return {
                    runs: runs.map(r => RunSchema.parse(r)),
                };
            }
        );
    }
};
