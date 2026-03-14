#!/usr/bin/env node

import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { TestRailClient } from "./client/testrail.js";
import { getCaseTool } from "./tools/get_case.js";
import { getCasesTool } from "./tools/get_cases.js";
import { getCaseFieldsTool } from "./tools/get_case_fields.js";
import { getTemplatesTool } from "./tools/get_templates.js";
import { updateCaseTool } from "./tools/update_case.js";
import { updateCasesTool } from "./tools/update_cases.js";
import { createCaseTool } from "./tools/create_case.js";
import { getSectionsTool } from "./tools/get_sections.js";
import { getProjectsTool } from "./tools/get_projects.js";
import { addRunTool } from "./tools/add_run.js";
import { getStatusesTool } from "./tools/get_statuses.js";
import { getPrioritiesTool } from "./tools/get_priorities.js";
import { getTestsTool } from "./tools/get_tests.js";
import { addResultsTool } from "./tools/add_results.js";
import { addAttachmentToRunTool } from "./tools/add_attachment_to_run.js";
import { removeNullish } from "./utils/sanitizer.js";
import z from "zod";

const EnvSchema = z.object({
    TESTRAIL_INSTANCE_URL: z.url('Must be a valid TestRail URL'),
    TESTRAIL_USERNAME: z.email('Must be a valid email address'),
    TESTRAIL_API_KEY: z.string().min(1, 'API key is required')
});

const parseResult = EnvSchema.safeParse(process.env);

if (!parseResult.success) {
    console.error(
        "Invalid TestRail environment configuration:",
        JSON.stringify(z.treeifyError(parseResult.error), null, 2));
    process.exit(1);
}

const { TESTRAIL_INSTANCE_URL, TESTRAIL_USERNAME, TESTRAIL_API_KEY } = parseResult.data;

const server = new McpServer({
    name: "TestRail MCP Server",
    version: "1.6.1",
});

const client = new TestRailClient(TESTRAIL_INSTANCE_URL, TESTRAIL_USERNAME, TESTRAIL_API_KEY);

const tools = [
    getProjectsTool,
    getCaseTool,
    getCasesTool,
    getCaseFieldsTool,
    getTemplatesTool,
    getSectionsTool,
    updateCaseTool,
    updateCasesTool,
    createCaseTool,
    addRunTool,
    getStatusesTool,
    getPrioritiesTool,
    getTestsTool,
    addResultsTool,
    addAttachmentToRunTool,
]

for (const tool of tools) {
    server.registerTool(
        tool.name,
        {
            description: tool.description,
            inputSchema: tool.parameters,
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
