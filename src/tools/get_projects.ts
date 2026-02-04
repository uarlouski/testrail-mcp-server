import { TestRailClient } from "../client/testrail.js";
import { ToolDefinition, withErrorHandling } from "../types/custom.js";

const parameters = {};

interface ProjectSchema {
    id: number;
    name: string;
}

interface ProjectsResponse {
    projects: ProjectSchema[];
}

export const getProjectsTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "get_projects",
    description: "Get all available projects in TestRail. Returns project IDs and names. Use this to find the project_id needed for get_sections and get_templates.",
    parameters,
    handler: withErrorHandling<typeof parameters, TestRailClient>(async (_args, client) => {
        const projects = await client.getProjects();

        const response: ProjectsResponse = {
            projects: projects
                .filter(p => !p.is_completed)
                .map(p => ({
                    id: p.id,
                    name: p.name,
                })),
        };

        return {
            content: [
                {
                    type: "text" as const,
                    text: JSON.stringify(response, null, 2),
                },
            ],
        };
    })
};
