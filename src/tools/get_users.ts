import { z } from "zod";
import { TestRailClient } from "../client/testrail.js";
import { ToolDefinition } from "../types/custom.js";
import { UserSchema } from "../types/testrail.js";

const parameters = {
    project_id: z.number().optional().describe("Optional ID of the project to retrieve users for. If omitted, attempts to fetch all users globally."),
    fallback_all_projects: z.boolean().optional().default(true).describe("If true and global user retrieval is forbidden (non-admin), automatically falls back to fetching users across all active projects."),
};

async function getUsersFallbackAllProjects(client: TestRailClient): Promise<any[]> {
    const projects = await client.getProjects();
    const activeProjects = projects.filter(p => !p.is_completed);
    const userPromises = activeProjects.map(project =>
        client.getUsers(project.id).catch(err => {
            console.error(`[get_users] Failed to fetch users for project ${project.id} (${project.name}): ${err.message}`);
            return [] as any[];
        })
    );
    const results = await Promise.all(userPromises);
    const allUsers = results.flat();

    const uniqueUsersMap = new Map<number, any>();
    for (const user of allUsers) {
        uniqueUsersMap.set(user.id, user);
    }
    return Array.from(uniqueUsersMap.values());
}

export const getUsersTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "get_users",
    description: "Get active users from TestRail. Resolves active users globally or per-project. If global fetch is forbidden (for non-admin accounts), falls back to merging users across all active projects so users referenced as reviewers or assignees can be resolved.",
    parameters,
    handler: async ({ project_id, fallback_all_projects }, client) => {
        let users: any[];

        try {
            users = await client.getUsers(project_id);
        } catch (err: any) {
            const isPermissionError = err.message?.includes("Access Denied");

            if (!project_id && fallback_all_projects !== false && isPermissionError) {
                console.error("[get_users] Global fetch failed (Access Denied). Falling back to multi-project polling...");
                users = await getUsersFallbackAllProjects(client);
            } else {
                throw err;
            }
        }

        return {
            users: users.map(user => UserSchema.parse(user))
        };
    }
};
