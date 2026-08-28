import { describe, test, expect } from "@jest/globals";
import { CaseFieldTypeId, FIELD_TYPES, getFieldType, SYSTEM_FIELDS } from "../../../src/tools/cases/fields.js";

describe("Field Types, Schema & Helpers", () => {
    test("defines CaseFieldTypeId constants correctly", () => {
        expect(CaseFieldTypeId.String).toBe(1);
        expect(CaseFieldTypeId.Integer).toBe(2);
        expect(CaseFieldTypeId.Text).toBe(3);
        expect(CaseFieldTypeId.URL).toBe(4);
        expect(CaseFieldTypeId.Checkbox).toBe(5);
        expect(CaseFieldTypeId.Dropdown).toBe(6);
        expect(CaseFieldTypeId.User).toBe(7);
        expect(CaseFieldTypeId.Date).toBe(8);
        expect(CaseFieldTypeId.Milestone).toBe(9);
        expect(CaseFieldTypeId.Steps).toBe(10);
        expect(CaseFieldTypeId.StepResults).toBe(11);
        expect(CaseFieldTypeId.MultiSelect).toBe(12);
        expect(CaseFieldTypeId.Scenarios).toBe(13);
        expect(CaseFieldTypeId.List).toBe(14);
    });

    test("contains all field types in FIELD_TYPES array", () => {
        expect(FIELD_TYPES.length).toBe(14);
        const stringType = FIELD_TYPES.find(t => t.typeId === CaseFieldTypeId.String);
        expect(stringType).toEqual({ typeId: 1, name: "String", isStructured: true });

        const stepsType = FIELD_TYPES.find(t => t.typeId === CaseFieldTypeId.Steps);
        expect(stepsType).toEqual({ typeId: 10, name: "Steps", isStructured: false });
    });

    test("getFieldType retrieves field type definition for known types", () => {
        expect(getFieldType(1)).toEqual({ typeId: 1, name: "String", isStructured: true });
        expect(getFieldType(12)).toEqual({ typeId: 12, name: "Multi-select", isStructured: true });
        expect(getFieldType(10)).toEqual({ typeId: 10, name: "Steps", isStructured: false });
    });

    test("getFieldType returns fallback for unknown types", () => {
        expect(getFieldType(999)).toEqual({ typeId: 999, name: "Unknown (999)", isStructured: true });
    });

    test("SYSTEM_FIELDS contains all standard system fields", () => {
        expect(SYSTEM_FIELDS.length).toBe(9);
        const systemNames = SYSTEM_FIELDS.map(f => f.system_name);
        expect(systemNames).toContain("title");
        expect(systemNames).toContain("section_id");
        expect(systemNames).toContain("template_id");
        expect(systemNames).toContain("type_id");
        expect(systemNames).toContain("priority_id");
        expect(systemNames).toContain("estimate");
        expect(systemNames).toContain("milestone_id");
        expect(systemNames).toContain("refs");
        expect(systemNames).toContain("labels");
    });
});
