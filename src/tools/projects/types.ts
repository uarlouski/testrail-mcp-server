import { z } from "zod";

export const ProjectSchema = z.object({
    id: z.number(),
    name: z.string(),
    is_completed: z.boolean(),
    suite_mode: z.number(),
});

export type Project = z.infer<typeof ProjectSchema>;

export const GetOneProjectSchema = z.object({
    action: z.literal("one").describe("Retrieve a single project by ID"),
    project_id: z.number().int().describe("The ID of the project"),
});

export const GetManyProjectsSchema = z.object({
    action: z.literal("many").describe("Retrieve all available projects"),
});
