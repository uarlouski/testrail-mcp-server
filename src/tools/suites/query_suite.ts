import { z } from "zod";
import { TestRailClient } from "../../client/testrail.js";
import { ToolDefinition } from "../../types/custom.js";
import { SuiteSchema, GetOneSuiteSchema, GetManySuitesSchema } from "./types.js";
import { handleQuery } from "../../utils/query_handler.js";

const parameters = {
    payload: z.discriminatedUnion("action", [
        GetOneSuiteSchema,
        GetManySuitesSchema,
    ]).describe("The payload containing the action ('one' or 'many') and corresponding parameters"),
};

export const querySuiteTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "query_suite",
    mode: "read",
    description: "Retrieve a single test suite or all test suites for a project in TestRail. Set payload.action to 'one' or 'many' to specify the operation.",
    parameters,
    handler: async (args, client) => {
        return handleQuery(
            args.payload,
            async (p) => {
                const suite = await client.getSuite(p.suite_id);
                return {
                    suite: SuiteSchema.parse(suite),
                };
            },
            async (p) => {
                const suites = await client.getSuites(p.project_id);
                return {
                    suites: suites.map(s => SuiteSchema.parse(s)),
                };
            }
        );
    }
};
