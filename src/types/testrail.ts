import { z } from "zod";

export const CaseFieldConfigSchema = z.object({
    options: z.object({
        default_value: z.string().optional(),
        is_required: z.boolean().optional(),
        items: z.string().optional(),
    }),
});

export type CaseFieldConfig = z.infer<typeof CaseFieldConfigSchema>;

export const CaseFieldSchema = z.object({
    id: z.number(),
    name: z.string(),
    system_name: z.string(),
    label: z.string(),
    type_id: z.number(),
    template_ids: z.array(z.number()),
    is_active: z.boolean(),
    description: z.string().nullable(),
    include_all: z.boolean(),
    configs: z.array(CaseFieldConfigSchema),
});

export type CaseField = z.infer<typeof CaseFieldSchema>;

export const CaseSchema = z.object({
    id: z.number(),
    title: z.string(),
    section_id: z.number(),
    template_id: z.number(),
    type_id: z.number(),
    priority_id: z.number(),
    milestone_id: z.number().nullable(),
    refs: z.string().nullable(),
    created_on: z.number(),
    updated_on: z.number(),
    estimate: z.string().nullable(),
    suite_id: z.number(),
    labels: z.array(z.any()),
}).loose();

export type Case = z.infer<typeof CaseSchema>;

export const SectionSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().nullish(),
    parent_id: z.number().nullish(),
    suite_id: z.number(),
});

export type Section = z.infer<typeof SectionSchema>;

export const PrioritySchema = z.object({
    id: z.number(),
    is_default: z.boolean(),
    name: z.string(),
});

export type Priority = z.infer<typeof PrioritySchema>;

export const CaseTypeSchema = z.object({
    id: z.number(),
    is_default: z.boolean(),
    name: z.string(),
});

export type CaseType = z.infer<typeof CaseTypeSchema>;

export const TemplateSchema = z.object({
    id: z.number(),
    name: z.string(),
    is_default: z.boolean(),
});

export type Template = z.infer<typeof TemplateSchema>;

export const ProjectSchema = z.object({
    id: z.number(),
    name: z.string(),
    is_completed: z.boolean(),
    suite_mode: z.number(),
});

export type Project = z.infer<typeof ProjectSchema>;

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

export const StatusSchema = z.object({
    id: z.number(),
    name: z.string(),
    label: z.string(),
});

export type Status = z.infer<typeof StatusSchema>;

export const TestSchema = z.object({
    id: z.number(),
    case_id: z.number(),
    status_id: z.number(),
    title: z.string(),
    run_id: z.number(),
})

export const TestsSchema = z.array(TestSchema)

export type Test = z.infer<typeof TestSchema>

export const ResultSchema = z.object({
    id: z.number(),
    test_id: z.number(),
    status_id: z.number(),
    comment: z.string().nullable(),
    defects: z.string().nullable(),
});

export type Result = z.infer<typeof ResultSchema>
