import { z } from "zod";
import { TestRailClient } from "../../client/testrail.js";
import { ToolDefinition } from "../../types/custom.js";
import { RunSchema, GetOneRunSchema, GetManyRunsSchema } from "./types.js";
import { handleQuery } from "../../utils/query_handler.js";

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
