import { z } from "zod";

/** Label as returned by the `get_labels` endpoint (uses `name`). */
export const LabelSchema = z.object({
    id: z.number(),
    name: z.string(),
});

export type Label = z.infer<typeof LabelSchema>;

/** Label as embedded in a case payload (`get_case`, `get_cases`); uses `title`. */
export const CaseLabelSchema = z.object({
    id: z.number(),
    title: z.string(),
});

export type CaseLabel = z.infer<typeof CaseLabelSchema>;

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

export const StatusSchema = z.object({
    id: z.number(),
    name: z.string(),
    label: z.string(),
});

export type Status = z.infer<typeof StatusSchema>;

export { TestSchema, TestsSchema, Test } from "../tests/types.js";

export const UserSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
});

export type User = z.infer<typeof UserSchema>;

export const ConfigurationSchema = z.object({
    id: z.number(),
    name: z.string(),
    group_id: z.number(),
});

export type Configuration = z.infer<typeof ConfigurationSchema>;

export const ConfigurationGroupSchema = z.object({
    id: z.number(),
    name: z.string(),
    project_id: z.number(),
    configs: z.array(ConfigurationSchema),
});

export type ConfigurationGroup = z.infer<typeof ConfigurationGroupSchema>;
