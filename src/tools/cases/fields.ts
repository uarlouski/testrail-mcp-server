export const CaseFieldTypeId = {
    String: 1,
    Integer: 2,
    Text: 3,
    URL: 4,
    Checkbox: 5,
    Dropdown: 6,
    User: 7,
    Date: 8,
    Milestone: 9,
    Steps: 10,
    StepResults: 11,
    MultiSelect: 12,
    Scenarios: 13,
    List: 14,
} as const;

export type CaseFieldTypeId = typeof CaseFieldTypeId[keyof typeof CaseFieldTypeId];

export interface FieldType {
    typeId: number;
    name: string;
    description?: string;
    isStructured: boolean;
}

export const FIELD_TYPES: Readonly<FieldType[]> = [
    { typeId: CaseFieldTypeId.String, name: "String", isStructured: true },
    { typeId: CaseFieldTypeId.Integer, name: "Integer", isStructured: true },
    { typeId: CaseFieldTypeId.Text, name: "Text", isStructured: false },
    { typeId: CaseFieldTypeId.URL, name: "URL", isStructured: true },
    { typeId: CaseFieldTypeId.Checkbox, name: "Checkbox", description: "Boolean value, either true or false.", isStructured: true },
    { typeId: CaseFieldTypeId.Dropdown, name: "Dropdown", isStructured: true },
    { typeId: CaseFieldTypeId.User, name: "User", isStructured: true },
    { typeId: CaseFieldTypeId.Date, name: "Date", isStructured: true },
    { typeId: CaseFieldTypeId.Milestone, name: "Milestone", isStructured: true },
    { typeId: CaseFieldTypeId.Steps, name: "Steps", isStructured: false },
    { typeId: CaseFieldTypeId.StepResults, name: "Step Results", isStructured: false },
    { typeId: CaseFieldTypeId.MultiSelect, name: "Multi-select", isStructured: true },
    { typeId: CaseFieldTypeId.Scenarios, name: "Scenarios", isStructured: false },
    { typeId: CaseFieldTypeId.List, name: "List", isStructured: true },
] as const;

export function getFieldType(typeId: number): FieldType {
    const found = FIELD_TYPES.find(t => t.typeId === typeId);
    return found ?? { typeId, name: `Unknown (${typeId})`, isStructured: true };
}

export interface FieldSchema {
    system_name: string;
    label: string;
    type: string;
    is_required: boolean;
    template_ids?: number[];
    options?: string[];
    description?: string;
    project_scope?: { scope: "global" } | { scope: "projects"; project_ids: number[] };
}

export const SYSTEM_FIELDS: FieldSchema[] = [
    { system_name: "title", label: "Title", type: getFieldType(CaseFieldTypeId.String).name, is_required: true, project_scope: { scope: "global" } },
    { system_name: "section_id", label: "Section", type: getFieldType(CaseFieldTypeId.Integer).name, is_required: true, project_scope: { scope: "global" } },
    { system_name: "template_id", label: "Template", type: getFieldType(CaseFieldTypeId.Integer).name, is_required: false, project_scope: { scope: "global" } },
    { system_name: "type_id", label: "Type", type: getFieldType(CaseFieldTypeId.Integer).name, is_required: false, project_scope: { scope: "global" } },
    { system_name: "priority_id", label: "Priority", type: getFieldType(CaseFieldTypeId.Integer).name, is_required: false, project_scope: { scope: "global" } },
    { system_name: "estimate", label: "Estimate", type: getFieldType(CaseFieldTypeId.String).name, is_required: false, project_scope: { scope: "global" } },
    { system_name: "milestone_id", label: "Milestone", type: getFieldType(CaseFieldTypeId.Integer).name, is_required: false, project_scope: { scope: "global" } },
    { system_name: "refs", label: "References", type: getFieldType(CaseFieldTypeId.String).name, is_required: false, project_scope: { scope: "global" } },
    { system_name: "labels", label: "Labels", type: getFieldType(CaseFieldTypeId.List).name, is_required: false, project_scope: { scope: "global" }, description: "Use get_labels tool to get available labels/tags." },
];
