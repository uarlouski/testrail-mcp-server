import { z } from "zod";
import { TestRailClient } from "../client/testrail.js";
import { ToolDefinition } from "../types/custom.js";
import { LabelSchema } from "../types/testrail.js";

const parameters = {
    project_id: z.number().describe("The ID of the project to retrieve labels for"),
};

export const getLabelsTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "get_labels",
    description: "Get all available test case labels (sometimes called tags) for a project. Returns label IDs and titles that can be used when creating or updating test cases.",
    parameters,
    handler: async ({ project_id }, client) => {
        const labels = await client.getLabels(project_id);
        return {
            labels: labels.map(l => LabelSchema.parse(l)),
        };
    },
};
