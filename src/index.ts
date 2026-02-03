import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { TestRailClient } from "./client/testrail.js";
import { getCaseTool } from "./tools/get_case.js";
import { getCaseFieldsTool } from "./tools/get_case_fields.js";
import { getTemplatesTool } from "./tools/get_templates.js";
import { updateCaseTool } from "./tools/update_case.js";

const TESTRAIL_INSTANCE_URL = process.env.TESTRAIL_INSTANCE_URL;
const TESTRAIL_USERNAME = process.env.TESTRAIL_USERNAME;
const TESTRAIL_API_KEY = process.env.TESTRAIL_API_KEY;

if (!TESTRAIL_INSTANCE_URL || !TESTRAIL_USERNAME || !TESTRAIL_API_KEY) {
    console.error("Error: TESTRAIL_INSTANCE_URL, TESTRAIL_USERNAME, and TESTRAIL_API_KEY environment variables are required.");
    process.exit(1);
}

const server = new McpServer({
    name: "TestRail MCP Server",
    version: "1.0.0",
});

const client = new TestRailClient(TESTRAIL_INSTANCE_URL, TESTRAIL_USERNAME, TESTRAIL_API_KEY);

const tools = [
    getCaseTool,
    getCaseFieldsTool,
    getTemplatesTool,
    updateCaseTool,
]

for (const tool of tools) {
    server.registerTool(
        tool.name,
        {
            description: tool.description,
            inputSchema: tool.parameters,
        },
        (args: any) => tool.handler(args, client)
    );
}

const transport = new StdioServerTransport();
await server.connect(transport);
