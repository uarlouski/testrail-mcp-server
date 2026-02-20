import { z } from "zod";
import { Label } from "./testrail.js";

export interface TestCaseResponse {
    id: number;
    title: string;
    section: string;
    type: string;
    priority: string;
    labels: Label[];
    references: string | null;
    [key: string]: any;
}

export interface ToolDefinition<T extends z.ZodRawShape, Context = any> {
    name: string;
    description: string;
    parameters: T;
    handler: (args: z.infer<z.ZodObject<T>>, context: Context) => Promise<Record<string, any>>;
}
