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
import { addResultsForCasesTool } from "./tools/add_results_for_cases.js";
import { getLabelsTool } from "./tools/get_labels.js";
import { getSharedStepsTool } from "./tools/shared_steps/get_shared_steps.js";
import { getSharedStepTool } from "./tools/shared_steps/get_shared_step.js";
import { getSharedStepHistoryTool } from "./tools/shared_steps/get_shared_step_history.js";
import { addSharedStepTool } from "./tools/shared_steps/add_shared_step.js";
import { updateSharedStepTool } from "./tools/shared_steps/update_shared_step.js";
import { deleteSharedStepTool } from "./tools/shared_steps/delete_shared_step.js";
import { removeNullish } from "./utils/sanitizer.js";
import z from "zod";

const EnvSchema = z.object({
    TESTRAIL_INSTANCE_URL: z.url('Must be a valid TestRail URL'),
    TESTRAIL_USERNAME: z.email('Must be a valid email address'),
    TESTRAIL_API_KEY: z.string().min(1, 'API key is required'),
    TESTRAIL_ENABLE_SHARED_STEPS: z.string().optional().transform(val => val === 'true')
});

const parseResult = EnvSchema.safeParse(process.env);

if (!parseResult.success) {
    console.error(
        "Invalid TestRail environment configuration:",
        JSON.stringify(z.treeifyError(parseResult.error), null, 2));
    process.exit(1);
}

const { TESTRAIL_INSTANCE_URL, TESTRAIL_USERNAME, TESTRAIL_API_KEY, TESTRAIL_ENABLE_SHARED_STEPS } = parseResult.data;

const server = new McpServer({
    name: "TestRail MCP Server",
    version: "1.8.0",
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
    addResultsForCasesTool,
    addAttachmentToRunTool,
    getLabelsTool,
]

if (TESTRAIL_ENABLE_SHARED_STEPS) {
    tools.push(getSharedStepsTool as any);
    tools.push(getSharedStepTool as any);
    tools.push(getSharedStepHistoryTool as any);
    tools.push(addSharedStepTool as any);
    tools.push(updateSharedStepTool as any);
    tools.push(deleteSharedStepTool as any);
}

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
