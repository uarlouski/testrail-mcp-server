import { jest } from '@jest/globals';
import { validateCaseFields } from "../../src/utils/validator.js";
import { TestRailClient } from "../../src/client/testrail.js";

jest.mock("../../src/client/testrail.js");

import { CaseField } from "../../src/types/testrail.js";

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
