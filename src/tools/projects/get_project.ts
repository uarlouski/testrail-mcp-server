import { z } from "zod";
import { TestRailClient } from "../../client/testrail.js";
import { ToolDefinition } from "../../types/custom.js";
import { ProjectSchema } from "../../types/testrail.js";

const parameters = {
    project_id: z.number().int().describe("The ID of the project"),
};

export const getProjectTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "get_project",
    mode: "read",
    description: "Get a specific project in TestRail by ID.",
    parameters,
    handler: async (args, client) => {
        const project = await client.getProject(args.project_id);

        return {
            project: ProjectSchema.parse(project),
        };
    }
};
