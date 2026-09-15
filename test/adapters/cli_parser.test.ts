import { describe, it, expect } from "@jest/globals";
import { z } from "zod";
import {
    parseArgs,
    coerceValue,
    coerceFlagsForTool,
    formatGeneralHelp,
    formatToolHelp
} from "../../src/adapters/cli_parser.js";
import { ToolDefinition } from "../../src/types/custom.js";

describe("cli_parser", () => {
    describe("parseArgs", () => {
        it("should parse command name and key-value flags", () => {
            const result = parseArgs(["query_project", "--action", "many", "--project_id", "12"]);
            expect(result.command).toBe("query_project");
            expect(result.flags).toEqual({
                action: "many",
                project_id: "12",
            });
        });

        it("should handle key=value syntax and kebab-case keys", () => {
            const result = parseArgs(["export_cases_for_rag", "--project-id=42", "--output-dir=./exports"]);
            expect(result.command).toBe("export_cases_for_rag");
            expect(result.flags).toEqual({
                project_id: "42",
                output_dir: "./exports",
            });
        });

        it("should handle boolean and inverted boolean flags", () => {
            const result = parseArgs(["some_tool", "--verbose", "--no-cache"]);
            expect(result.flags.verbose).toBe(true);
            expect(result.flags.cache).toBe(false);
        });

        it("should extract global connection options", () => {
            const result = parseArgs([
                "query_project",
                "--url", "https://example.testrail.io",
                "--username", "user@example.com",
                "--api-key", "secret123",
                "--action", "one"
            ]);
            expect(result.command).toBe("query_project");
            expect(result.globalOptions.url).toBe("https://example.testrail.io");
            expect(result.globalOptions.username).toBe("user@example.com");
            expect(result.globalOptions.apiKey).toBe("secret123");
            expect(result.flags.action).toBe("one");
            expect(result.flags.url).toBeUndefined();
        });

        it("should detect help and version flags", () => {
            const helpResult = parseArgs(["--help"]);
            expect(helpResult.globalOptions.help).toBe(true);

            const versionResult = parseArgs(["-v"]);
            expect(versionResult.globalOptions.version).toBe(true);

            const cmdHelpResult = parseArgs(["query_project", "-h"]);
            expect(cmdHelpResult.command).toBe("query_project");
            expect(cmdHelpResult.globalOptions.help).toBe(true);
        });
    });

    describe("coerceValue", () => {
        it("should coerce string numbers to number type", () => {
            expect(coerceValue("123")).toBe(123);
            expect(coerceValue("0")).toBe(0);
            expect(coerceValue("-5")).toBe(-5);
        });

        it("should coerce boolean strings to boolean type", () => {
            expect(coerceValue("true")).toBe(true);
            expect(coerceValue("false")).toBe(false);
            expect(coerceValue(true)).toBe(true);
        });

        it("should coerce comma-separated strings to array of strings", () => {
            expect(coerceValue("field1, field2, field3")).toEqual(["field1", "field2", "field3"]);
        });

        it("should coerce comma-separated numbers to array of numbers or union", () => {
            expect(coerceValue("10, 20, 30")).toEqual([10, 20, 30]);
            expect(coerceValue("101, C102, 103")).toEqual([101, "C102", 103]);
        });

        it("should coerce JSON string to record/object", () => {
            expect(coerceValue('{"status":"active","count":5}')).toEqual({
                status: "active",
                count: 5,
            });
            expect(coerceValue('[1, 2, 3]')).toEqual([1, 2, 3]);
            expect(coerceValue('{invalid json}')).toBe('{invalid json}');
        });

        it("should handle null, undefined, and array inputs", () => {
            expect(coerceValue(undefined)).toBeUndefined();
            expect(coerceValue(null)).toBeNull();
            expect(coerceValue(["1", "2"])).toEqual([1, 2]);
        });
    });

    describe("coerceFlagsForTool", () => {
        it("should coerce flat parameters directly for standard tools", () => {
            const parameters = {
                project_id: z.number(),
                suite_id: z.number().optional(),
                ignored_fields: z.array(z.string()).optional(),
            };

            const rawFlags = {
                help: true,
                version: true,
                _: ["some_cmd"],
                project_id: "15",
                suite_id: "3",
                ignored_fields: "custom_status,review",
            };

            const result = coerceFlagsForTool(rawFlags, parameters);
            expect(result).toEqual({
                project_id: 15,
                suite_id: 3,
                ignored_fields: ["custom_status", "review"],
            });
        });

        it("should auto-wrap flat flags into payload for discriminated union tools", () => {
            const OneSchema = z.object({
                action: z.literal("one"),
                project_id: z.number(),
            });
            const ManySchema = z.object({
                action: z.literal("many"),
            });
            const parameters = {
                payload: z.discriminatedUnion("action", [OneSchema, ManySchema]),
            };

            // Test action: "many"
            const manyResult = coerceFlagsForTool({ action: "many" }, parameters);
            expect(manyResult).toEqual({
                payload: {
                    action: "many",
                },
            });

            // Test action: "one"
            const oneResult = coerceFlagsForTool({ action: "one", project_id: "99" }, parameters);
            expect(oneResult).toEqual({
                payload: {
                    action: "one",
                    project_id: 99,
                },
            });
        });
    });

    describe("help formatters", () => {
        const dummyTool: ToolDefinition<any, any> = {
            name: "test_tool",
            description: "A test tool for unit verification",
            mode: "read",
            parameters: {
                project_id: z.number().describe("The ID of the project"),
                tags: z.array(z.string()).optional().describe("List of tags"),
                raw_opt: z.string(),
            },
            handler: async () => ({ success: true }),
        };

        it("should generate general help listing commands", () => {
            const help = formatGeneralHelp([dummyTool]);
            expect(help).toContain("test_tool");
            expect(help).toContain("A test tool for unit verification");
            expect(help).toContain("Usage: testrail-cli <command> [options]");
        });

        it("should generate tool-specific help showing parameter descriptions", () => {
            const toolHelp = formatToolHelp(dummyTool);
            expect(toolHelp).toContain("Command: test_tool");
            expect(toolHelp).toContain("--project_id <number>");
            expect(toolHelp).toContain("--tags <array>");
            expect(toolHelp).toContain("(Optional)");
            expect(toolHelp).toContain("(Required)");
        });
    });
});
