import { Case, CaseField } from "../tools/cases/types.js";
import { sanitizeValue } from "./sanitizer.js";

/**
 * Processes custom fields from a test case, converting system names to human-readable labels
 * and mapping dropdown values to their display text.
 */
export function processCustomFields(
    testCase: Case,
    caseFields: CaseField[]
): Record<string, any> {
    if (!testCase) {
        throw new Error("Test case is undefined or null");
    }

    const templateId = testCase.template_id;
    const result: Record<string, any> = {};

    const applicableFields = caseFields.filter(field =>
        field.include_all || field.template_ids.includes(templateId)
    );

    const fieldNameMap = new Map<string, string>();
    const dropdownOptionsMap = new Map<string, Map<string, string>>();

    for (const field of applicableFields) {
        fieldNameMap.set(field.system_name, toSnakeCase(field.label));

        const optionsMap = parseDropdownOptions(field);
        if (optionsMap.size > 0) {
            dropdownOptionsMap.set(field.system_name, optionsMap);
        }
    }

    for (const [key, value] of Object.entries(testCase)) {
        if (!key.startsWith("custom_")) continue;
        if (value === null || value === undefined) continue;

        if (!fieldNameMap.has(key)) {
            console.error(`No field mapping found for: ${key}`);
            result[key] = value;
            continue;
        }

        const outputKey = fieldNameMap.get(key)!;
        let finalValue = value;

        if (dropdownOptionsMap.has(key)) {
            const options = dropdownOptionsMap.get(key)!;
            const optionKey = String(value);
            finalValue = options.get(optionKey) || value;
        }

        result[outputKey] = sanitizeValue(finalValue);
    }

    return result;
}

/**
 * Parse dropdown options from field configs.
 * If projectId is provided, prioritizes configuration specific to that project.
 * Format: "1, First\n2, Second\n3, Third"
 */
export function parseDropdownOptions(field: CaseField, projectId?: number): Map<string, string> {
    const options = new Map<string, string>();

    let configsToParse = field.configs;
    if (projectId !== undefined) {
        const projectConfig = field.configs.find(c =>
            c.context && !c.context.is_global && c.context.project_ids.includes(projectId)
        );
        if (projectConfig) {
            configsToParse = [projectConfig];
        } else {
            const globalConfig = field.configs.find(c => c.context?.is_global);
            if (globalConfig) {
                configsToParse = [globalConfig];
            }
        }
    }

    for (const config of configsToParse) {
        const items = config.options?.items;
        if (!items) continue;

        const lines = items.split(/\r?\n/);
        for (const line of lines) {
            const commaIndex = line.indexOf(',');
            if (commaIndex > 0) {
                const id = line.substring(0, commaIndex).trim();
                const label = line.substring(commaIndex + 1).trim();
                options.set(id, label);
            }
        }
    }

    return options;
}

function toSnakeCase(str: string): string {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
}
