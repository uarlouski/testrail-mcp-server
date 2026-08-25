import { z } from "zod";
import { TestRailClient } from "../../client/testrail.js";
import { ToolDefinition } from "../../types/custom.js";
import { parseDropdownOptions } from "../../utils/mapper.js";
import { isActive } from "../../utils/sanitizer.js";
import { isFieldForProject } from "./get_case_fields.js";

const parameters = {
    project_id: z.number().describe("The ID of the project to resolve field values for"),
    field_name: z.string().describe("The system name of the Multi-select field (e.g. 'custom_case_feature_tags')"),
    refs: z.union([z.number(), z.array(z.number())]).describe("A single numeric ID or array of numeric IDs/references (e.g. [1, 55, 6] or 55) to resolve"),
};

const description = `
Resolve numeric reference IDs of a Multi-select case field (type ID 12) into their textual values for a specific project.
`;

export const resolveCaseFieldTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "resolve_case_field",
    mode: "read",
    description: description.trim(),
    parameters,
    handler: async ({ project_id, field_name, refs }, client) => {
        const caseFields = await client.getCaseFields();
        const activeFields = caseFields.filter(isActive);

        const targetField = activeFields.find(
            f => f.system_name.toLowerCase() === field_name.toLowerCase()
        );

        if (!targetField) {
            throw new Error(`Field '${field_name}' not found in active case fields.`);
        }

        if (targetField.type_id !== 12) {
            throw new Error(`Field '${targetField.system_name}' is of type_id ${targetField.type_id}, but resolve_case_field only supports Multi-select fields (type_id: 12).`);
        }

        if (!isFieldForProject(targetField, project_id)) {
            throw new Error(`Field '${targetField.system_name}' is not enabled for project ID ${project_id}.`);
        }

        const options = parseDropdownOptions(targetField, project_id);
        const refList = Array.isArray(refs) ? refs : [refs];

        const resolved = refList.map(ref => {
            const val = options.get(String(ref)) ?? null;
            return {
                id: ref,
                value: val,
            };
        });

        return {
            field_name: targetField.system_name,
            resolved,
        };
    }
};
