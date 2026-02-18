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
import { getTestsTool } from "./tools/get_tests.js";
import { addResultsTool } from "./tools/add_results.js";
import { addAttachmentToRunTool } from "./tools/add_attachment_to_run.js";
import { removeNullish } from "./utils/sanitizer.js";

const TESTRAIL_INSTANCE_URL = process.env.TESTRAIL_INSTANCE_URL;
const TESTRAIL_USERNAME = process.env.TESTRAIL_USERNAME;
const TESTRAIL_API_KEY = process.env.TESTRAIL_API_KEY;

if (!TESTRAIL_INSTANCE_URL || !TESTRAIL_USERNAME || !TESTRAIL_API_KEY) {
    console.error("Error: TESTRAIL_INSTANCE_URL, TESTRAIL_USERNAME, and TESTRAIL_API_KEY environment variables are required.");
    process.exit(1);
}

const server = new McpServer({
    name: "TestRail MCP Server",
    version: "1.3.0",
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
