import { z } from "zod";

export const SharedStepContentSchema = z.object({
    content: z.string(),
    expected: z.string().nullable().optional(),
});

export type SharedStepContent = z.infer<typeof SharedStepContentSchema>;

export const SharedStepSchema = z.object({
    id: z.number(),
    title: z.string(),
    project_id: z.number().optional(),
    custom_steps_separated: z.array(SharedStepContentSchema).optional(),
    case_ids: z.array(z.number()).optional(),
});

export type SharedStep = z.infer<typeof SharedStepSchema>;

export const SharedStepHistorySchema = z.object({
    id: z.number(),
    title: z.string(),
    timestamp: z.number().optional(),
    custom_steps_separated: z.array(SharedStepContentSchema).optional(),
});

export type SharedStepHistory = z.infer<typeof SharedStepHistorySchema>;
