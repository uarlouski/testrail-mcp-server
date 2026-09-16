#!/usr/bin/env node

import "dotenv/config";
import { z } from "zod";
import { TestRailClient } from "./client/testrail.js";
import { ALL_TOOLS } from "./tools/registry.js";
import { removeNullish } from "./utils/sanitizer.js";
import { ToolDefinition } from "./types/custom.js";
import { parseArgs, ParsedCliArgs, coerceFlagsForTool, formatGeneralHelp, formatToolHelp } from "./adapters/cli_parser.js";
import { VERSION } from "./version.js";

const CredentialSchema = z.object({
    url: z.url("Must be a valid TestRail URL (e.g. https://example.testrail.io)"),
    username: z.email("Must be a valid email address"),
    apiKey: z.string().min(1, "API key is required"),
});

export function resolveClient(
    options: ParsedCliArgs["globalOptions"],
    env: Record<string, string | undefined>
): TestRailClient | null {
    const instanceUrl = options.url || env.TESTRAIL_INSTANCE_URL;
    const username = options.username || env.TESTRAIL_USERNAME;
    const apiKey = options.apiKey || env.TESTRAIL_API_KEY;

    const credResult = CredentialSchema.safeParse({
        url: instanceUrl,
        username,
        apiKey,
    });

    if (!credResult.success) {
        console.error("Error: Missing or invalid TestRail credentials.");
        for (const issue of credResult.error.issues) {
            console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
        }
        console.error("\nPlease set TESTRAIL_INSTANCE_URL, TESTRAIL_USERNAME, and TESTRAIL_API_KEY environment variables,");
        console.error("or supply them via --url, --username, and --api-key options.");
        return null;
    }

    return new TestRailClient(credResult.data.url, credResult.data.username, credResult.data.apiKey);
}

export function validateToolArgs(
    tool: ToolDefinition<any, any>,
    flags: Record<string, any>
): Record<string, any> | null {
    const coercedArgs = coerceFlagsForTool(flags, tool.parameters);
    const ToolSchema = z.object(tool.parameters);
    const validationResult = ToolSchema.safeParse(coercedArgs);

    if (!validationResult.success) {
        console.error(`Validation error for command "${tool.name}":`);
        for (const issue of validationResult.error.issues) {
            console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
        }
        console.error(`\nRun 'testrail-cli ${tool.name} --help' for flag specifications.`);
        return null;
    }

    return validationResult.data;
}

export async function executeTool(
    tool: ToolDefinition<any, any>,
    client: TestRailClient,
    args: Record<string, any>
): Promise<number> {
    try {
        const output = await tool.handler(args, client);
        const sanitized = removeNullish(output);
        console.log(JSON.stringify(sanitized, null, 2));
        return 0;
    } catch (error: any) {
        console.error(`Error executing "${tool.name}": ${error.message || error}`);
        return 1;
    }
}

export async function runCli(
    argv: string[],
    env: Record<string, string | undefined> = process.env,
    clientOverride?: TestRailClient
): Promise<number> {
    const { command, flags, globalOptions } = parseArgs(argv);

    if (globalOptions.version) {
        console.log(`testrail-cli v${VERSION}`);
        return 0;
    }

    if (!command) {
        if (globalOptions.help) {
            console.log(formatGeneralHelp(ALL_TOOLS));
            return 0;
        }
        console.error("Error: No command specified.\n");
        console.error(formatGeneralHelp(ALL_TOOLS));
        return 1;
    }

    const tool = ALL_TOOLS.find(t => t.name === command);
    if (!tool) {
        console.error(`Error: Unknown command "${command}".\n`);
        console.error("Run 'testrail-cli --help' to view available commands.");
        return 1;
    }

    if (globalOptions.help) {
        console.log(formatToolHelp(tool));
        return 0;
    }

    const client = clientOverride || resolveClient(globalOptions, env);
    if (!client) {
        return 1;
    }

    const toolArgs = validateToolArgs(tool, flags);
    if (!toolArgs) {
        return 1;
    }

    return executeTool(tool, client, toolArgs);
}

// Direct execution from CLI
const isDirectExecution = process.argv[1] && (
    process.argv[1].endsWith("/cli.js") ||
    process.argv[1].endsWith("/cli.ts") ||
    process.argv[1].endsWith("/testrail-cli")
);

if (isDirectExecution) {
    runCli(process.argv.slice(2)).then(code => {
        if (code !== 0) {
            process.exit(code);
        }
    }).catch(err => {
        console.error("Unexpected error:", err);
        process.exit(1);
    });
}
