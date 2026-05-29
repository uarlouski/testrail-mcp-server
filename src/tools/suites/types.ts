import { z } from "zod";

export const SuiteSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().nullable().optional(),
    project_id: z.number(),
    url: z.string(),
}).loose();

export type Suite = z.infer<typeof SuiteSchema>;

export const BaseSuiteFields = z.object({
    name: z.string().describe("The name of the test suite"),
    description: z.string().optional().describe("The description of the test suite"),
});

export const CreateSuiteSchema = BaseSuiteFields.extend({
    action: z.literal("create").describe("The operation to perform: create a new test suite"),
    project_id: z.number().describe("The ID of the project the test suite should be added to"),
});

export const UpdateSuiteSchema = BaseSuiteFields.partial().extend({
    action: z.literal("update").describe("The operation to perform: update an existing test suite"),
    suite_id: z.number().describe("The ID of the test suite to update"),
});

export const GetOneSuiteSchema = z.object({
    action: z.literal("one").describe("Retrieve a single test suite by ID"),
    suite_id: z.number().int().describe("The ID of the test suite"),
});

export const GetManySuitesSchema = z.object({
    action: z.literal("many").describe("Retrieve all test suites for a project"),
    project_id: z.number().int().describe("The ID of the project"),
});
