import { z } from "zod";

export const TestSchema = z.looseObject({
    id: z.number(),
    case_id: z.number(),
    status_id: z.number(),
    title: z.string(),
    run_id: z.number(),
});

export const TestsSchema = z.array(TestSchema);

export type Test = z.infer<typeof TestSchema>;

export const GetOneTestSchema = z.object({
    action: z.literal("one").describe("Retrieve a single test by ID"),
    test_id: z.union([z.number(), z.string()]).describe("The ID of the test (e.g. 123 or 'T123')"),
});

export const GetManyTestsSchema = z.object({
    action: z.literal("many").describe("Retrieve tests for a test run"),
    run_id: z.number().int().describe("The ID of the test run"),
    status_id: z.array(z.number()).optional().describe("Optional array of status IDs to filter by. Use get_statuses to retrieve available status IDs"),
    fields: z.array(z.string()).optional().describe("Additional fields to include in response beyond default fields (id, case_id, status_id, title, run_id). Example: ['assignedto_id', 'priority_id', 'refs']"),
    output_file: z.string().optional().describe("Absolute file path to save the JSON response to. Use this for large datasets to avoid blowing up context limits."),
});
