import { z } from "zod";

export const SectionSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().nullish(),
    parent_id: z.number().nullish(),
    suite_id: z.number(),
});

export type Section = z.infer<typeof SectionSchema>;

export const BaseSectionFields = z.object({
    name: z.string().describe("The name of the section"),
    description: z.string().optional().describe("The description of the section"),
});

export const CreateSectionSchema = BaseSectionFields.extend({
    action: z.literal("create").describe("The operation to perform: create a new section"),
    project_id: z.number().describe("The ID of the project the section should be added to"),
    suite_id: z.number().optional().describe("The ID of the test suite (required for multi-suite projects, i.e. suite_mode=2 or 3). Use get_suites to find available suites"),
    parent_id: z.number().optional().describe("The ID of the parent section (to build section hierarchies)"),
});

export const UpdateSectionSchema = BaseSectionFields.partial().extend({
    action: z.literal("update").describe("The operation to perform: update an existing section"),
    section_id: z.number().describe("The ID of the section to update"),
});

export interface SectionTreeItem extends Section {
    children?: SectionTreeItem[];
}

export const GetOneSectionSchema = z.object({
    action: z.literal("one").describe("Retrieve a single section by ID"),
    section_id: z.number().int().describe("The ID of the section"),
    project_id: z.number().int().optional().describe("The ID of the project (required when include_child is true to fetch child sections)"),
    suite_id: z.number().int().optional().describe("The ID of the test suite (for multi-suite projects). Use query_suite to find available suites"),
    include_child: z.boolean().optional().default(false).describe("Whether to include child/descendant sections in the response as a nested tree. Defaults to false"),
});

export type GetOneSection = z.infer<typeof GetOneSectionSchema>;

export const GetManySectionsSchema = z.object({
    action: z.literal("many").describe("Retrieve all sections for a project"),
    project_id: z.number().int().describe("The ID of the project. Use query_project to find available projects"),
    suite_id: z.number().int().optional().describe("The ID of the test suite (required for multi-suite projects, i.e. suite_mode=2 or 3). Use query_suite to find available suites"),
    name_pattern: z.string().optional().describe("Optional regex pattern to filter sections by name (e.g. 'auth.*' or 'login|signup'). Case-insensitive."),
    output_file: z.string().optional().describe("Absolute file path to save the JSON response to. Use this for large datasets to avoid blowing up context limits."),
});

export type GetManySections = z.infer<typeof GetManySectionsSchema>;

