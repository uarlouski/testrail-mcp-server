import { z } from "zod";
import { ToolDefinition } from "../types/custom.js";

export interface ParsedCliArgs {
    command?: string;
    flags: Record<string, any>;
    globalOptions: {
        url?: string;
        username?: string;
        apiKey?: string;
        help?: boolean;
        version?: boolean;
    };
}

/**
 * Parses raw command-line arguments into a command name, tool flags, and global connection options.
 */
export function parseArgs(argv: string[]): ParsedCliArgs {
    let command: string | undefined;
    const flags: Record<string, any> = {};
    const globalOptions: ParsedCliArgs["globalOptions"] = {};

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        if (arg === "-h" || arg === "--help") {
            globalOptions.help = true;
            flags.help = true;
        } else if (arg === "-v" || arg === "--version") {
            globalOptions.version = true;
            flags.version = true;
        } else if (!arg.startsWith("-")) {
            if (!command) {
                command = arg;
            }
        } else {
            let [rawKey, val] = arg.replace(/^--?/, "").split("=");
            let isNegative = false;

            if (rawKey.startsWith("no-")) {
                rawKey = rawKey.slice(3);
                isNegative = true;
            }

            const key = rawKey.replace(/-/g, "_");

            if (val === undefined) {
                if (isNegative) {
                    val = "false";
                } else if (i + 1 < argv.length && !argv[i + 1].startsWith("-")) {
                    val = argv[++i];
                } else {
                    val = "true";
                }
            }

            if (key === "url") {
                globalOptions.url = val;
            } else if (key === "username") {
                globalOptions.username = val;
            } else if (key === "api_key" || key === "apikey") {
                globalOptions.apiKey = val;
            } else {
                flags[key] = val === "true" ? true : val === "false" ? false : val;
            }
        }
    }

    return { command, flags, globalOptions };
}

/**
 * Coerces primitive CLI strings to numbers, booleans, JSON objects, or arrays.
 */
export function coerceValue(raw: any): any {
    if (raw === undefined || raw === null || typeof raw === "boolean") {
        return raw;
    }

    if (typeof raw === "string") {
        const trimmed = raw.trim();
        if (trimmed === "true") {
            return true;
        }
        if (trimmed === "false") {
            return false;
        }

        // JSON objects or arrays
        if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
            try {
                return JSON.parse(trimmed);
            } catch {
                /* fall through */
            }
        }

        // Comma-separated array list
        if (trimmed.includes(",")) {
            return trimmed.split(",").map(item => coerceValue(item.trim()));
        }

        // Numeric string
        if (!isNaN(Number(trimmed)) && trimmed !== "") {
            return Number(trimmed);
        }

        return raw;
    }

    if (Array.isArray(raw)) {
        return raw.map(item => coerceValue(item));
    }

    return raw;
}

/**
 * Coerces flat CLI flags and auto-wraps into `{ payload: ... }` for discriminated union tools.
 */
export function coerceFlagsForTool(rawFlags: Record<string, any>, parameters: z.ZodRawShape): Record<string, any> {
    const cleanFlags: Record<string, any> = {};
    for (const [key, val] of Object.entries(rawFlags)) {
        if (key === "help" || key === "version" || key === "_") {
            continue;
        }
        cleanFlags[key] = coerceValue(val);
    }

    // Auto-wrap into payload if the tool expects a payload container (e.g. query_project)
    if (parameters.payload && !cleanFlags.payload) {
        return { payload: cleanFlags };
    }

    return cleanFlags;
}

/**
 * Formats general CLI help documentation.
 */
export function formatGeneralHelp(tools: ToolDefinition<any, any>[]): string {
    const maxLen = Math.max(...tools.map(t => t.name.length), 20);
    const cmdList = tools
        .map(t => `  ${t.name.padEnd(maxLen + 2, " ")}${t.description.split("\n")[0]}`)
        .join("\n");

    return [
        "TestRail CLI - Execute TestRail actions directly in terminal & CI/CD",
        "",
        "Usage: testrail-cli <command> [options]",
        "",
        "Commands:",
        cmdList,
        "",
        "Global Options:",
        "  --url <url>           TestRail instance URL (overrides TESTRAIL_INSTANCE_URL)",
        "  --username <email>    TestRail username (overrides TESTRAIL_USERNAME)",
        "  --api-key <key>       TestRail API key (overrides TESTRAIL_API_KEY)",
        "  -h, --help            Show help documentation",
        "  -v, --version         Show CLI version",
        "",
        "Run 'testrail-cli <command> --help' for command-specific flags."
    ].join("\n");
}

/**
 * Formats tool-specific help documentation.
 */
export function formatToolHelp(tool: ToolDefinition<any, any>): string {
    const shapes: Record<string, any>[] = [];
    const params = tool.parameters;

    if (params.payload) {
        const payloadDef = (params.payload as any).def;
        if (Array.isArray(payloadDef?.options)) {
            for (const opt of payloadDef.options) {
                shapes.push(opt.shape);
            }
        }
    } else {
        shapes.push(params);
    }

    const seen = new Set<string>();
    const options: string[] = [];

    for (const shape of shapes) {
        for (const [name, fieldSchema] of Object.entries<any>(shape)) {
            if (seen.has(name)) {
                continue;
            }
            seen.add(name);

            const def = fieldSchema?.def;
            const isOptional = def?.type === "optional";
            const innerDef = isOptional ? def?.innerType?.def : def;
            const type = innerDef?.type || "string";
            const desc = fieldSchema?.description || "";
            const req = isOptional ? "(Optional)" : "(Required)";

            options.push(`  --${name} <${type}>  ${desc} ${req}`.trimEnd());
        }
    }

    return [
        `Command: ${tool.name}`,
        `Description: ${tool.description}`,
        "",
        "Options:",
        ...options,
        "",
        "Global Options:",
        "  --url <url>           TestRail instance URL",
        "  --username <email>    TestRail username",
        "  --api-key <key>       TestRail API key",
        "  -h, --help            Show help for this command"
    ].join("\n");
}
