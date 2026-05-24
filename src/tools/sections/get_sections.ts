import { z } from "zod";
import fs from "fs";
import { TestRailClient } from "../../client/testrail.js";
import { ToolDefinition } from "../../types/custom.js";
import { SectionSchema } from "../../types/testrail.js";

const parameters = {
    project_id: z.number().describe("The ID of the project. Use get_projects to find available projects"),
    output_file: z.string().optional().describe("Absolute file path to save the JSON response to. Use this for large datasets to avoid blowing up context limits."),
};

export const getSectionsTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "get_sections",
    mode: "read",
    description: "Get all sections for a project. Returns section IDs and names that can be used with add_case",
    parameters,
    handler: async ({ project_id, output_file }, client) => {
        const sections = await client.getSections(project_id);

        const response = {
            sections: sections.map(s => SectionSchema.parse(s)),
        };

        if (output_file) {
            await fs.promises.writeFile(output_file, JSON.stringify(response), "utf-8");
            return {
                success: true,
                message: `Successfully exported ${response.sections.length} sections to ${output_file}`,
                file: output_file
            };
        }

        return response;
    }
};
