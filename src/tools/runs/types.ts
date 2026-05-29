import { z } from "zod";

export const RunSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().nullable(),
    suite_id: z.number().nullable(),
    project_id: z.number(),
    is_completed: z.boolean(),
    passed_count: z.number(),
    blocked_count: z.number(),
    untested_count: z.number(),
    retest_count: z.number(),
    failed_count: z.number(),
    url: z.string(),
});

export type Run = z.infer<typeof RunSchema>;

export const BaseRunFields = z.object({
    name: z.string().optional().describe("The name of the test run"),
    description: z.string().optional().describe("The description of the test run"),
    case_ids: z.array(z.number()).optional().describe("An array of case IDs for the custom case selection"),
});

export const CreateRunSchema = BaseRunFields.extend({
    action: z.literal("create").describe("The operation to perform: create a new test run"),
    project_id: z.number().describe("The ID of the project the test run should be added to"),
    suite_id: z.number().optional().describe("The ID of the test suite for the test run"),
    case_ids: z.array(z.number()).optional().describe("Array of case IDs to include in the run. If provided, the run will only include these cases; otherwise, all cases will be included."),
});

export const UpdateRunSchema = BaseRunFields.extend({
    action: z.literal("update").describe("The operation to perform: update an existing test run"),
    run_id: z.number().describe("The ID of the test run to update"),
});

export const GetOneRunSchema = z.object({
    action: z.literal("one").describe("Retrieve a single test run by ID"),
    run_id: z.number().int().describe("The ID of the test run"),
});

export const GetManyRunsSchema = z.object({
    action: z.literal("many").describe("Retrieve all test runs for a project"),
    project_id: z.number().int().describe("The ID of the project"),
    suite_id: z.number().int().optional().describe("Filter by suite ID"),
    is_completed: z.number().int().min(0).max(1).optional().describe("Filter by completion status (1 for completed, 0 for active)"),
});

export const AttachmentSchema = z.object({
    attachment_id: z.number(),
});

export type Attachment = z.infer<typeof AttachmentSchema>;

