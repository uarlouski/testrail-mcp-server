import { TestRailClient } from "../client/testrail.js";
import { z } from "zod";
import { RunSchema } from "../types/testrail.js";
import { ToolDefinition } from "../types/custom.js";

const parameters = {
    project_id: z.number().describe("The ID of the project. Use get_projects to find available projects"),
    name: z.string().optional().describe("The name of the test run"),
    description: z.string().optional().describe("The description of the test run"),
    case_ids: z.array(z.number()).describe("Array of case IDs to include in the run. After creating the run, use get_tests with the returned run_id to retrieve test IDs for result submission")
}

export const addRunTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "add_run",
    description: "Create a new test run in TestRail",
    parameters,
    handler: async ({ project_id, ...fields }, client: TestRailClient) => {
        const caseData = await client.getCase(fields.case_ids[0]);
        const params = { suite_id: caseData.suite_id, include_all: false, ...fields };
        const run = await client.addRun(project_id, params);

        return RunSchema.parse(run);
    },
};
