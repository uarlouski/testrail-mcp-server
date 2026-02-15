import { TestRailClient } from "../client/testrail.js";
import { ToolDefinition } from "../types/custom.js";
import { ProjectSchema } from "../types/testrail.js";

const parameters = {};

export const getProjectsTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "get_projects",
    description: "Get all available projects in TestRail. Returns project IDs and names that can be used with get_sections, get_templates, get_cases, and add_run",
    parameters,
    handler: async (_args, client) => {
        const projects = await client.getProjects();

        return {
            projects: projects
                .filter(p => !p.is_completed)
                .map(p => ProjectSchema.parse(p)),
        };
    }
};
