import { z } from "zod";
import { TestRailClient } from "../../client/testrail.js";
import { ToolDefinition } from "../../types/custom.js";
import { CaseField } from "./types.js";
import { parseDropdownOptions } from "../../utils/mapper.js";
import { isActive } from "../../utils/sanitizer.js";

// Field remains optional for backward compatibility with previous implementation.
// However, it is recommended to always provide project_id to get fields applicable to the project.
const parameters = {
    project_id: z.number().optional().describe("The project ID to get fields for. This is the primary way to use this tool, as it returns only the fields relevant to your current project. If omitted, returns all fields across all projects."),
};

export const CASE_FIELDS_PARAM_DESCRIPTION = `
A flat key-value map of case fields. The server merges all entries directly into the root of the TestRail API request body — there is no nested "fields" key in the API call.
Must use system_name values from get_case_fields.
Example: {"priority_id": 2, "template_id": 1, "labels": [1, 2]}
Call get_case_fields with project_id first if field names are not already known.
Using an unknown field name (e.g. 'label_ids') will result in an error.
`;

export const FIELD_TYPES: Readonly<FieldType[]> = [
    { typeId: 1, name: "String" },
    { typeId: 2, name: "Integer" },
    { typeId: 3, name: "Text" },
    { typeId: 4, name: "URL" },
    { typeId: 5, name: "Checkbox", description: "Boolean value, either true or false." },
    { typeId: 6, name: "Dropdown" },
    { typeId: 7, name: "User" },
    { typeId: 8, name: "Date" },
    { typeId: 9, name: "Milestone" },
    { typeId: 10, name: "Steps" },
    { typeId: 11, name: "Step Results" },
    { typeId: 12, name: "Multi-select" },
    { typeId: 13, name: "Scenarios" },
    { typeId: 14, name: "List" },
] as const;

export interface FieldType {
    typeId: number;
    name: string;
    description?: string;
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

function getFieldType(typeId: number): FieldType {
    const found = FIELD_TYPES.find(t => t.typeId === typeId);
    return found ?? { typeId, name: `Unknown (${typeId})` };
}

function isFieldRequired(field: CaseField): boolean {
    return field.configs.some(config => config.options?.is_required === true);
}

export function mapToFieldSchema(field: CaseField): FieldSchema {
    const fieldType = getFieldType(field.type_id);
    const descriptions = [field.description, fieldType.description].filter(Boolean);

    const schema: FieldSchema = {
        system_name: field.system_name,
        label: field.label,
        type: fieldType.name,
        is_required: isFieldRequired(field),
    };

    if (descriptions.length > 0) {
        schema.description = descriptions.join(" ");
    }

    if (!field.include_all && field.template_ids.length > 0) {
        schema.template_ids = field.template_ids;
    }

    if (field.type_id === 6 || field.type_id === 12) {
        schema.options = Array.from(parseDropdownOptions(field).values());
    }

    const contexts = field.configs.map(c => c.context).filter(Boolean) as { is_global: boolean; project_ids: number[] }[];
    if (contexts.length > 0) {
        const isGlobal = contexts.some(ctx => ctx.is_global);
        if (isGlobal) {
            schema.project_scope = { scope: "global" };
        } else {
            const projectIds = [...new Set(contexts.flatMap(ctx => ctx.project_ids))];
            schema.project_scope = { scope: "projects", project_ids: projectIds };
        }
    }

    return schema;
}

function isFieldForProject(field: CaseField, projectId: number): boolean {
    const contexts = field.configs.map(c => c.context).filter(Boolean) as { is_global: boolean; project_ids: number[] }[];
    if (contexts.length === 0) return true;
    return contexts.some(ctx => ctx.is_global || ctx.project_ids.includes(projectId));
}

export const SYSTEM_FIELDS: FieldSchema[] = [
    { system_name: "title", label: "Title", type: getFieldType(1).name, is_required: true, project_scope: { scope: "global" } },
    { system_name: "section_id", label: "Section", type: getFieldType(2).name, is_required: true, project_scope: { scope: "global" } },
    { system_name: "template_id", label: "Template", type: getFieldType(2).name, is_required: false, project_scope: { scope: "global" } },
    { system_name: "type_id", label: "Type", type: getFieldType(2).name, is_required: false, project_scope: { scope: "global" } },
    { system_name: "priority_id", label: "Priority", type: getFieldType(2).name, is_required: false, project_scope: { scope: "global" } },
    { system_name: "estimate", label: "Estimate", type: getFieldType(1).name, is_required: false, project_scope: { scope: "global" } },
    { system_name: "milestone_id", label: "Milestone", type: getFieldType(2).name, is_required: false, project_scope: { scope: "global" } },
    { system_name: "refs", label: "References", type: getFieldType(1).name, is_required: false, project_scope: { scope: "global" } },
    { system_name: "labels", label: "Labels", type: getFieldType(14).name, is_required: false, project_scope: { scope: "global" }, description: "Use get_labels tool to get available labels/tags." },
];

const description = `
Get the field schema for test cases for a specific project.
You should normally provide project_id to get fields applicable to your project.
If you truly need all fields across all projects, you may omit project_id, but this is rarely what you want.
Returns available fields with their types and options (for dropdown fields).
`;

export const getCaseFieldsTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "get_case_fields",
    mode: "read",
    description: description.trim(),
    parameters,
    handler: async ({ project_id }, client) => {
        const caseFields = await client.getCaseFields();

        const activeFields = caseFields.filter(isActive);
        const filtered = project_id !== undefined
            ? activeFields.filter(field => isFieldForProject(field, project_id))
            : activeFields;

        const customFieldSchemas = filtered.map(mapToFieldSchema);

        const allFields = [...SYSTEM_FIELDS, ...customFieldSchemas];
        const fields = project_id !== undefined
            ? allFields.map(({ project_scope: _, ...rest }) => rest)
            : allFields;

        return { fields };
    }
};
