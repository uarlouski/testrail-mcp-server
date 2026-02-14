import { z } from "zod";

export interface TestCaseResponse {
    id: number;
    title: string;
    section: string;
    type: string;
    priority: string;
    labels: string[];
    references: string | null;
    [key: string]: any;
}

export interface ToolDefinition<T extends z.ZodRawShape, Context = any> {
    name: string;
    description: string;
    parameters: T;
    handler: (args: z.infer<z.ZodObject<T>>, context: Context) => Promise<Record<string, any>>;
}
