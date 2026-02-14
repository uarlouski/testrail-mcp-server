import { TestRailClient } from "../client/testrail.js";
import { ToolDefinition } from "../types/custom.js";
import { CaseField } from "../types/testrail.js";
import { parseDropdownOptions } from "../utils/mapper.js";

const parameters = {};

interface FieldSchema {
    system_name: string;
    label: string;
    type: string;
    is_required: boolean;
    template_ids?: number[];
    options?: string[];
}

interface CaseFieldsResponse {
    fields: FieldSchema[];
}

const FIELD_TYPE_NAMES: Record<number, string> = {
    1: "String",
    2: "Integer",
    3: "Text",
    4: "URL",
    5: "Checkbox",
    6: "Dropdown",
    7: "User",
    8: "Date",
    9: "Milestone",
    10: "Steps",
    11: "Step Results",
    12: "Multi-select",
    13: "Scenarios",
};

function getFieldTypeName(typeId: number): string {
    return FIELD_TYPE_NAMES[typeId] || `Unknown (${typeId})`;
}

function isFieldRequired(field: CaseField): boolean {
    return field.configs.some(config => config.options?.is_required === true);
}

function mapToFieldSchema(field: CaseField): FieldSchema {
    const schema: FieldSchema = {
        system_name: field.system_name,
        label: field.label,
        type: getFieldTypeName(field.type_id),
        is_required: isFieldRequired(field),
    };

    if (!field.include_all && field.template_ids.length > 0) {
        schema.template_ids = field.template_ids;
    }

    if (field.type_id === 6 || field.type_id === 12) {
        schema.options = Array.from(parseDropdownOptions(field).values());
    }

    return schema;
}

const SYSTEM_FIELDS: FieldSchema[] = [
    { system_name: "title", label: "Title", type: "String", is_required: true },
    { system_name: "section_id", label: "Section", type: "Integer", is_required: true },
    { system_name: "template_id", label: "Template", type: "Integer", is_required: false },
    { system_name: "type_id", label: "Type", type: "Integer", is_required: false },
    { system_name: "priority_id", label: "Priority", type: "Integer", is_required: false },
    { system_name: "estimate", label: "Estimate", type: "String", is_required: false },
    { system_name: "milestone_id", label: "Milestone", type: "Integer", is_required: false },
    { system_name: "refs", label: "References", type: "String", is_required: false },
];

export const getCaseFieldsTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "get_case_fields",
    description: "Get the field schema for test cases. Returns all available fields with their types, descriptions, and options (for dropdown fields). Use this to understand what fields can be set when creating or updating test cases.",
    parameters,
    handler: async (_args, client) => {
        const caseFields = await client.getCaseFields();

        const customFieldSchemas = caseFields.filter(field => field.is_active).map(mapToFieldSchema);

        const response: CaseFieldsResponse = {
            fields: [...SYSTEM_FIELDS, ...customFieldSchemas],
        };

        return response;
    }
};
