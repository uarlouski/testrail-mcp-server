#!/usr/bin/env node

import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { TestRailClient } from "./client/testrail.js";
import { getToolsToRegister } from "./tools/registry.js";
import { removeNullish } from "./utils/sanitizer.js";
import z from "zod";

const EnvSchema = z.object({
    TESTRAIL_INSTANCE_URL: z.url('Must be a valid TestRail URL'),
    TESTRAIL_USERNAME: z.email('Must be a valid email address'),
    TESTRAIL_API_KEY: z.string().min(1, 'API key is required'),
    TESTRAIL_ENABLE_SHARED_STEPS: z.string().optional().transform(val => val === 'true'),
    TESTRAIL_ALLOW_WRITE_OPERATIONS: z.string().optional().transform(val => val === undefined ? true : val === 'true'),
    TESTRAIL_ALLOW_READ_OPERATIONS: z.string().optional().transform(val => val === undefined ? true : val === 'true'),
    TESTRAIL_ALLOW_DELETE_OPERATIONS: z.string().optional().transform(val => val === 'true')
});

const parseResult = EnvSchema.safeParse(process.env);

if (!parseResult.success) {
    console.error(
        "Invalid TestRail environment configuration:",
        JSON.stringify(z.treeifyError(parseResult.error), null, 2));
    process.exit(1);
}

const {
    TESTRAIL_INSTANCE_URL,
    TESTRAIL_USERNAME,
    TESTRAIL_API_KEY,
    TESTRAIL_ENABLE_SHARED_STEPS,
    TESTRAIL_ALLOW_WRITE_OPERATIONS,
    TESTRAIL_ALLOW_READ_OPERATIONS,
    TESTRAIL_ALLOW_DELETE_OPERATIONS
} = parseResult.data;

const server = new McpServer({
    name: "TestRail MCP Server",
    version: "2.0.0",
});

const client = new TestRailClient(TESTRAIL_INSTANCE_URL, TESTRAIL_USERNAME, TESTRAIL_API_KEY);

const tools = getToolsToRegister({
    enableSharedSteps: TESTRAIL_ENABLE_SHARED_STEPS,
    allowWrite: TESTRAIL_ALLOW_WRITE_OPERATIONS,
    allowRead: TESTRAIL_ALLOW_READ_OPERATIONS,
    allowDelete: TESTRAIL_ALLOW_DELETE_OPERATIONS
});

for (const tool of tools) {
    server.registerTool(
        tool.name,
        {
            description: tool.description,
            inputSchema: tool.parameters,
            annotations: tool.annotations,
        },
        async (args: any) => {
            try {
                const output: Record<string, any> = await tool.handler(args, client);
                const sanitized = removeNullish(output);

                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify(sanitized),
                        },
                    ],
                } as any;
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );
}

const transport = new StdioServerTransport();
await server.connect(transport);
