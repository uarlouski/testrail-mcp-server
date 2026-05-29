import { z } from "zod";
import { LabelSchema } from "../commons/types.js";

export const CaseFieldConfigSchema = z.object({
    context: z.object({
        is_global: z.boolean(),
        project_ids: z.array(z.number()),
    }).optional(),
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
    labels: z.array(LabelSchema),
}).loose();

export type Case = z.infer<typeof CaseSchema>;
