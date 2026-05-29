import { z } from "zod";

export const ResultSchema = z.object({
    id: z.number(),
    test_id: z.number(),
    status_id: z.number(),
    comment: z.string().nullable(),
    defects: z.string().nullable(),
});

export type Result = z.infer<typeof ResultSchema>;
