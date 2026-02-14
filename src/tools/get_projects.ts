import { TestRailClient } from "../client/testrail.js";
import { ToolDefinition } from "../types/custom.js";
import { ProjectSchema } from "../types/testrail.js";

const parameters = {};

export const getProjectsTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "get_projects",
    description: "Get all available projects in TestRail. Returns project IDs and names. Use this to find the project_id needed for get_sections and get_templates.",
    parameters,
    handler: async (_args, client) => {
        const projects = await client.getProjects();

        const response = {
            projects: projects
                .filter(p => !p.is_completed)
                .map(p => ProjectSchema.parse(p)),
        };

        return response;
    }
};
