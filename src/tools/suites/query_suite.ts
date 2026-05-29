import { z } from "zod";
import { TestRailClient } from "../../client/testrail.js";
import { ToolDefinition } from "../../types/custom.js";
import { SuiteSchema } from "../../types/testrail.js";
import { handleQuery } from "../../utils/query_handler.js";

const GetOneSuiteSchema = z.object({
    action: z.literal("one").describe("Retrieve a single test suite by ID"),
    suite_id: z.number().int().describe("The ID of the test suite"),
});

const GetManySuitesSchema = z.object({
    action: z.literal("many").describe("Retrieve all test suites for a project"),
    project_id: z.number().int().describe("The ID of the project"),
});

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
