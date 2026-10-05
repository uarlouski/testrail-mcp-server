import { z } from "zod";
import fs from "fs";
import { TestRailClient } from "../../client/testrail.js";
import { ToolDefinition } from "../../types/custom.js";
import { GetOneTestSchema, GetManyTestsSchema, TestSchema } from "./types.js";
import { handleQuery } from "../../utils/query_handler.js";
import { normalizeEntityId } from "../../utils/sanitizer.js";

const parameters = {
    payload: z.discriminatedUnion("action", [
        GetOneTestSchema,
        GetManyTestsSchema,
    ]).describe("The payload containing the action ('one' or 'many') and corresponding parameters"),
};

export const queryTestTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "query_test",
    mode: "read",
    description: "Retrieve a single test by ID or all tests for a test run in TestRail. Set payload.action to 'one' or 'many' to specify the operation.",
    parameters,
    handler: async (args, client) => {
        return handleQuery(
            args.payload,
            async (p) => {
                const testId = normalizeEntityId(p.test_id);
                const test = await client.getTest(testId);
                return {
                    test: TestSchema.parse(test),
                };
            },
            async (p) => {
                const tests = await client.getTests(p.run_id, p.status_id);

                const response = {
                    tests: tests.map(t => {
                        const baseTest: Record<string, any> = {
                            id: t.id,
                            case_id: t.case_id,
                            status_id: t.status_id,
                            title: t.title,
                            run_id: t.run_id,
                        };

                        if (p.fields && p.fields.length > 0) {
                            for (const field of p.fields) {
                                if (field in t) {
                                    baseTest[field] = (t as Record<string, any>)[field];
                                }
                            }
                        }

                        return baseTest;
                    }),
                };

                if (p.output_file) {
                    await fs.promises.writeFile(p.output_file, JSON.stringify(response), "utf-8");
                    return {
                        success: true,
                        message: `Successfully exported ${response.tests.length} tests to ${p.output_file}`,
                        file: p.output_file,
                    };
                }

                return response;
            }
        );
    }
};
