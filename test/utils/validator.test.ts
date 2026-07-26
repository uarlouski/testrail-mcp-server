import { jest } from '@jest/globals';
import { validateCaseFields, validateSuiteId } from "../../src/utils/validator.js";
import { TestRailClient } from "../../src/client/testrail.js";

jest.mock("../../src/client/testrail.js");

import { CaseField } from "../../src/tools/cases/types.js";

describe("validateCaseFields", () => {
    let mockCaseFields: CaseField[];

    beforeEach(() => {
        mockCaseFields = [
            {
                id: 1,
                name: "custom_automation_priority",
                system_name: "custom_automation_priority",
                label: "Automation Priority",
                type_id: 2,
                template_ids: [],
                is_active: true,
                description: null,
                include_all: true,
                configs: [],
            },
            {
                id: 2,
                name: "custom_inactive_field",
                system_name: "custom_inactive_field",
                label: "Inactive Field",
                type_id: 1,
                template_ids: [],
                is_active: false,
                description: null,
                include_all: true,
                configs: [],
            }
        ] as unknown as CaseField[];
    });

    it("should succeed when given an empty object", () => {
        expect(() => validateCaseFields({}, mockCaseFields)).not.toThrow();
    });

    it("should succeed when given an empty array", () => {
        expect(() => validateCaseFields([], mockCaseFields)).not.toThrow();
    });

    it("should succeed with valid system fields (Record)", () => {
        const fields = {
            title: "Test",
            priority_id: 2,
            template_id: 1,
        };
        expect(() => validateCaseFields(fields, mockCaseFields)).not.toThrow();
    });

    it("should succeed with valid system fields (Array)", () => {
        const fields = ["title", "priority_id", "template_id"];
        expect(() => validateCaseFields(fields, mockCaseFields)).not.toThrow();
    });

    it("should succeed with active custom fields", () => {
        const fields = {
            custom_automation_priority: 1,
        };
        expect(() => validateCaseFields(fields, mockCaseFields)).not.toThrow();
    });

    it("should throw an error for an invalid field (Record)", () => {
        const fields = {
            title: "Test",
            invalid_field: "value",
        };
        expect(() => validateCaseFields(fields, mockCaseFields)).toThrow(/Invalid fields provided: 'invalid_field'/);
    });

    it("should throw an error for an invalid field (Array)", () => {
        const fields = ["title", "invalid_field"];
        expect(() => validateCaseFields(fields, mockCaseFields)).toThrow(/Invalid fields provided: 'invalid_field'/);
    });

    it("should throw an error for an inactive custom field", () => {
        const fields = {
            custom_inactive_field: "value",
        };
        expect(() => validateCaseFields(fields, mockCaseFields)).toThrow(/Invalid fields provided: 'custom_inactive_field'/);
    });

    it("should allow id and suite_id", () => {
        const fields = ["id", "suite_id"];
        expect(() => validateCaseFields(fields, mockCaseFields)).not.toThrow();
    });

    it("should accumulate multiple invalid fields in the error message", () => {
        const fields = ["title", "invalid_1", "invalid_2"];
        expect(() => validateCaseFields(fields, mockCaseFields)).toThrow(/Invalid fields provided: 'invalid_1', 'invalid_2'/);
    });
});


describe("validateSuiteId", () => {
    let mockClient: any;

    beforeEach(() => {
        mockClient = {
            getProject: jest.fn<any>(),
        };
    });

    it("should not throw when suite_id is provided", async () => {
        // Should not even call getProject when suite_id is provided
        await expect(validateSuiteId(mockClient, 10, 123)).resolves.toBeUndefined();
        expect(mockClient.getProject).not.toHaveBeenCalled();
    });

    it("should not throw when project is single-suite (suite_mode=1)", async () => {
        mockClient.getProject.mockResolvedValue({
            id: 53,
            name: "Single Suite Project",
            is_completed: false,
            suite_mode: 1,
        });

        await expect(validateSuiteId(mockClient, 53, undefined)).resolves.toBeUndefined();
        expect(mockClient.getProject).toHaveBeenCalledWith(53);
    });

    it("should throw when project is baseline (suite_mode=2) and suite_id is missing", async () => {
        mockClient.getProject.mockResolvedValue({
            id: 50,
            name: "Baseline Project",
            is_completed: false,
            suite_mode: 2,
        });

        await expect(validateSuiteId(mockClient, 50, undefined)).rejects.toThrow(
            'Project "Baseline Project" (id: 50) uses multiple test suites/baselines (suite_mode=2). ' +
            'The suite_id parameter is required. Use get_suites to find available suites for this project.'
        );
        expect(mockClient.getProject).toHaveBeenCalledWith(50);
    });

    it("should throw when project is multi-suite (suite_mode=3) and suite_id is missing", async () => {
        mockClient.getProject.mockResolvedValue({
            id: 10,
            name: "Sandbox",
            is_completed: false,
            suite_mode: 3,
        });

        await expect(validateSuiteId(mockClient, 10, undefined)).rejects.toThrow(
            'Project "Sandbox" (id: 10) uses multiple test suites/baselines (suite_mode=3). ' +
            'The suite_id parameter is required. Use get_suites to find available suites for this project.'
        );
        expect(mockClient.getProject).toHaveBeenCalledWith(10);
    });

    it("should not throw when project is multi-suite but suite_id is provided", async () => {
        // suite_id provided means early return, no getProject call
        await expect(validateSuiteId(mockClient, 10, 9308)).resolves.toBeUndefined();
        expect(mockClient.getProject).not.toHaveBeenCalled();
    });
});
