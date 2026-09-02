import { z } from "zod";
import fs from "fs";
import { TestRailClient } from "../../client/testrail.js";
import { ToolDefinition } from "../../types/custom.js";
import { Section, SectionSchema, SectionTreeItem, GetOneSectionSchema, GetManySectionsSchema } from "./types.js";
import { handleQuery } from "../../utils/query_handler.js";
import { validateSuiteId } from "../../utils/validator.js";

const parameters = {
    payload: z.discriminatedUnion("action", [
        GetOneSectionSchema,
        GetManySectionsSchema,
    ]).describe("The payload containing the action ('one' or 'many') and corresponding parameters"),
};

export function buildSectionTree(parent: Section, allSections: Section[]): SectionTreeItem {
    const children = allSections.filter(s => s.parent_id === parent.id);
    return {
        ...SectionSchema.parse(parent),
        children: children.map(child => buildSectionTree(child, allSections)),
    };
}

export const querySectionTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "query_section",
    mode: "read",
    description: "Retrieve a single section or all sections for a project in TestRail. Set payload.action to 'one' or 'many' to specify the operation.",
    parameters,
    handler: async (args, client) => {
        return handleQuery(
            args.payload,
            async (p) => {
                if (p.include_child) {
                    if (!p.project_id) {
                        throw new Error("project_id is required when include_child is true to resolve child sections");
                    }
                    await validateSuiteId(client, p.project_id, p.suite_id);
                    const allSections = await client.getSections(p.project_id, p.suite_id);
                    let targetSection = allSections.find(s => s.id === p.section_id);
                    if (!targetSection) {
                        targetSection = await client.getSection(p.section_id);
                    }
                    return {
                        section: buildSectionTree(targetSection, allSections),
                    };
                }

                const section = await client.getSection(p.section_id);
                return {
                    section: SectionSchema.parse(section),
                };
            },
            async (p) => {
                await validateSuiteId(client, p.project_id, p.suite_id);
                let sections = await client.getSections(p.project_id, p.suite_id);

                if (p.name_pattern) {
                    try {
                        const regex = new RegExp(p.name_pattern, "i");
                        sections = sections.filter(s => regex.test(s.name));
                    } catch (err) {
                        throw new Error(`Invalid regex pattern provided for name_pattern: '${p.name_pattern}'`);
                    }
                }

                const response = {
                    sections: sections.map(s => SectionSchema.parse(s)),
                };

                if (p.output_file) {
                    await fs.promises.writeFile(p.output_file, JSON.stringify(response), "utf-8");
                    return {
                        success: true,
                        message: `Successfully exported ${response.sections.length} sections to ${p.output_file}`,
                        file: p.output_file,
                    };
                }

                return response;
            }
        );
    }
};
