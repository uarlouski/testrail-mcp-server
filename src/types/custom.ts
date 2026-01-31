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
    handler: (args: z.infer<z.ZodObject<T>>, context: Context) => Promise<any>;
}

export function withErrorHandling<T extends z.ZodRawShape, Context = any>(
    handler: (args: z.infer<z.ZodObject<T>>, context: Context) => Promise<any>
): (args: z.infer<z.ZodObject<T>>, context: Context) => Promise<any> {
    return async (args, context) => {
        try {
            return await handler(args, context);
        } catch (error: any) {
            return {
                content: [{ type: "text", text: `Error: ${error.message}` }],
                isError: true,
            };
        }
    };
}
