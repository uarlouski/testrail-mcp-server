import { z } from "zod";
import { TestRailClient } from "../../client/testrail.js";
import { ToolDefinition } from "../../types/custom.js";
import { ConfigurationGroupSchema } from "./types.js";

const parameters = {
    project_id: z.number().int().describe("The ID of the project"),
};

export const getConfigurationsTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "get_configurations",
    mode: "read",
    description: "Get all configuration groups and configurations for a project in TestRail.",
    parameters,
    handler: async (args, client) => {
        const configs = await client.getConfigs(args.project_id);
        return {
            configurations: configs.map(c => ConfigurationGroupSchema.parse(c)),
        };
    }
};
