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
    parent_id: z.number().optional().describe("The ID of the parent section (to build section hierarchies)"),
});

export const UpdateSectionSchema = BaseSectionFields.partial().extend({
    action: z.literal("update").describe("The operation to perform: update an existing section"),
    section_id: z.number().describe("The ID of the section to update"),
});
