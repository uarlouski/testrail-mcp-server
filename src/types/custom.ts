import { z } from "zod";
import { Label } from "../tools/commons/types.js";

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

export type ToolMode = 'write' | 'read' | 'delete';

export interface ToolAnnotations {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
}

export interface ToolDefinition<T extends z.ZodRawShape, Context = any> {
    name: string;
    description: string;
    parameters: T;
    mode: ToolMode;
    annotations?: ToolAnnotations;
    handler: (args: z.infer<z.ZodObject<T>>, context: Context) => Promise<Record<string, any>>;
}

