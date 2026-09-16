import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { runCli } from "../src/cli.js";
import { TestRailClient } from "../src/client/testrail.js";
import { VERSION } from "../src/version.js";

describe("cli execution", () => {
    let logSpy: any;
    let errorSpy: any;

    const mockEnv = {
        TESTRAIL_INSTANCE_URL: "https://test.testrail.io",
        TESTRAIL_USERNAME: "tester@example.com",
        TESTRAIL_API_KEY: "dummy-api-key",
    };

    beforeEach(() => {
        logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should print general help and exit with 0 when --help is passed", async () => {
        const exitCode = await runCli(["--help"], mockEnv);
        expect(exitCode).toBe(0);
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("TestRail CLI"));
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("query_project"));
    });

    it("should print version and exit with 0 when --version is passed", async () => {
        const exitCode = await runCli(["--version"], mockEnv);
        expect(exitCode).toBe(0);
        expect(logSpy).toHaveBeenCalledWith(`testrail-cli v${VERSION}`);
    });

    it("should print error and exit with 1 when no command is provided", async () => {
        const exitCode = await runCli([], mockEnv);
        expect(exitCode).toBe(1);
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Error: No command specified."));
    });

    it("should print error and exit with 1 for unknown commands", async () => {
        const exitCode = await runCli(["unknown_tool_xyz"], mockEnv);
        expect(exitCode).toBe(1);
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Error: Unknown command "unknown_tool_xyz"'));
    });

    it("should print tool help and exit with 0 when command --help is passed", async () => {
        const exitCode = await runCli(["query_project", "--help"], mockEnv);
        expect(exitCode).toBe(0);
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Command: query_project"));
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("--action"));
    });

    it("should fail with exit code 1 if TestRail credentials are missing", async () => {
        const exitCode = await runCli(["query_project", "--action", "many"], {});
        expect(exitCode).toBe(1);
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Error: Missing or invalid TestRail credentials."));
    });

    it("should accept credentials from CLI flags if environment variables are missing", async () => {
        const mockClient = {
            getProjects: jest.fn<any>().mockResolvedValue([
                { id: 1, name: "Project Alpha", is_completed: false, suite_mode: 1 }
            ]),
        } as unknown as TestRailClient;

        const exitCode = await runCli([
            "query_project",
            "--url", "https://cli.testrail.io",
            "--username", "cli@example.com",
            "--api-key", "cli-token",
            "--action", "many"
        ], {}, mockClient);

        expect(exitCode).toBe(0);
        expect(mockClient.getProjects).toHaveBeenCalled();
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Project Alpha"));
    });

    it("should execute query_project --action many successfully", async () => {
        const mockClient = {
            getProjects: jest.fn<any>().mockResolvedValue([
                { id: 10, name: "Active Project", is_completed: false, suite_mode: 1 },
                { id: 20, name: "Completed Project", is_completed: true, suite_mode: 1 },
            ]),
        } as unknown as TestRailClient;

        const exitCode = await runCli(["query_project", "--action", "many"], mockEnv, mockClient);
        expect(exitCode).toBe(0);
        expect(mockClient.getProjects).toHaveBeenCalled();

        const loggedOutput = JSON.parse(logSpy.mock.calls[0][0]);
        expect(loggedOutput.projects).toHaveLength(1);
        expect(loggedOutput.projects[0].name).toBe("Active Project");
    });

    it("should execute query_project --action one --project_id 42 successfully", async () => {
        const mockClient = {
            getProject: jest.fn<any>().mockResolvedValue({
                id: 42,
                name: "Specific Project",
                is_completed: false,
                suite_mode: 2,
            }),
        } as unknown as TestRailClient;

        const exitCode = await runCli(["query_project", "--action", "one", "--project_id", "42"], mockEnv, mockClient);
        expect(exitCode).toBe(0);
        expect(mockClient.getProject).toHaveBeenCalledWith(42);

        const loggedOutput = JSON.parse(logSpy.mock.calls[0][0]);
        expect(loggedOutput.project.id).toBe(42);
        expect(loggedOutput.project.name).toBe("Specific Project");
    });

    it("should fail validation and exit with 1 if query_project --action one is missing project_id", async () => {
        const exitCode = await runCli(["query_project", "--action", "one"], mockEnv);
        expect(exitCode).toBe(1);
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Validation error for command "query_project"'));
    });

    it("should execute export_cases_for_rag with flags successfully", async () => {
        const mockClient = {
            getProject: jest.fn<any>().mockResolvedValue({ id: 1, name: "Project Alpha", suite_mode: 1 }),
            getCases: jest.fn<any>().mockResolvedValue([
                { id: 101, title: "Login Smoke Test", section_id: 5, priority_id: 2, template_id: 1, updated_on: 1700005000 }
            ]),
            getSection: jest.fn<any>().mockResolvedValue({ id: 5, name: "Auth" }),
            getPriorities: jest.fn<any>().mockResolvedValue([{ id: 2, name: "High" }]),
            getCaseFields: jest.fn<any>().mockResolvedValue([]),
        } as unknown as TestRailClient;

        const exitCode = await runCli([
            "export_cases_for_rag",
            "--project_id", "1",
            "--output_dir", "./scratch/test_rag_export"
        ], mockEnv, mockClient);

        expect(exitCode).toBe(0);
        expect(mockClient.getCases).toHaveBeenCalled();
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"exported_count": 1'));
    });

    it("should handle tool execution failure and exit with 1", async () => {
        const mockClient = {
            getProject: jest.fn<any>().mockRejectedValue(new Error("API Connection Failed")),
        } as unknown as TestRailClient;

        const exitCode = await runCli(["query_project", "--action", "one", "--project_id", "1"], mockEnv, mockClient);
        expect(exitCode).toBe(1);
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Error executing "query_project": API Connection Failed'));
    });

    it("should handle tool execution failure with non-Error value and exit with 1", async () => {
        const mockClient = {
            getProject: jest.fn<any>().mockRejectedValue("Plain string error"),
        } as unknown as TestRailClient;

        const exitCode = await runCli(["query_project", "--action", "one", "--project_id", "1"], mockEnv, mockClient);
        expect(exitCode).toBe(1);
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Error executing "query_project": Plain string error'));
    });

    it("should fall back to process.env when env argument is omitted", async () => {
        const originalUrl = process.env.TESTRAIL_INSTANCE_URL;
        delete process.env.TESTRAIL_INSTANCE_URL;
        const exitCode = await runCli(["query_project", "--action", "many"]);
        expect(exitCode).toBe(1);
        if (originalUrl) {
            process.env.TESTRAIL_INSTANCE_URL = originalUrl;
        }
    });
});
