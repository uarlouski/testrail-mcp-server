import { z } from "zod";
import { TestRailClient } from "../../client/testrail.js";
import { ToolDefinition } from "../../types/custom.js";
import { ProjectSchema } from "../../types/testrail.js";
import { handleQuery } from "../../utils/query_handler.js";

const GetOneProjectSchema = z.object({
    action: z.literal("one").describe("Retrieve a single project by ID"),
    project_id: z.number().int().describe("The ID of the project"),
});

const GetManyProjectsSchema = z.object({
    action: z.literal("many").describe("Retrieve all available projects"),
});

const parameters = {
    payload: z.discriminatedUnion("action", [
        GetOneProjectSchema,
        GetManyProjectsSchema,
    ]).describe("The payload containing the action ('one' or 'many') and corresponding parameters"),
};

export const queryProjectTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "query_project",
    mode: "read",
    description: "Retrieve a single project or all projects in TestRail. Set payload.action to 'one' or 'many' to specify the operation.",
    parameters,
    handler: async (args, client) => {
        return handleQuery(
            args.payload,
            async (p) => {
                const project = await client.getProject(p.project_id);
                return {
                    project: ProjectSchema.parse(project),
                };
            },
            async (p) => {
                const projects = await client.getProjects();
                const filteredProjects = projects.filter(prj => !prj.is_completed);

                return {
                    projects: filteredProjects.map(prj => ProjectSchema.parse(prj)),
                };
            }
        );
    }
};
