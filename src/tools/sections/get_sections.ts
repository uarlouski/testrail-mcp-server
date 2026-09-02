import { z } from "zod";
import fs from "fs";
import { TestRailClient } from "../../client/testrail.js";
import { ToolDefinition } from "../../types/custom.js";
import { SectionSchema } from "./types.js";
import { validateSuiteId } from "../../utils/validator.js";

const parameters = {
    project_id: z.number().describe("The ID of the project. Use get_projects to find available projects"),
    suite_id: z.number().optional().describe("The ID of the test suite (required for multi-suite projects, i.e. suite_mode=3). Use get_suites to find available suites"),
    output_file: z.string().optional().describe("Absolute file path to save the JSON response to. Use this for large datasets to avoid blowing up context limits."),
};

/**
 * @deprecated Use `query_section` with payload.action = 'many' instead.
 */
export const getSectionsTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "get_sections",
    mode: "read",
    deprecated: true,
    description: "Get all sections for a project. (Deprecated: Prefer query_section tool). Returns section IDs and names that can be used with add_case",
    parameters,
    handler: async ({ project_id, suite_id, output_file }, client) => {
        await validateSuiteId(client, project_id, suite_id);

        const sections = await client.getSections(project_id, suite_id);

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
