import { CaseField } from "../types/testrail.js";
import { SYSTEM_FIELDS, mapToFieldSchema } from "../tools/get_case_fields.js";

/**
 * Validates that the provided fields exist in the TestRail case schema.
 * Throws an Error if any field is invalid.
 * 
 * @param fields A record of fields or array of field names to validate
 * @param caseFields Available custom case fields from TestRail
 */
export function validateCaseFields(fields: Record<string, any> | string[], caseFields: CaseField[]): void {
    const fieldKeys = Array.isArray(fields) ? fields : Object.keys(fields);

    if (fieldKeys.length === 0) {
        return;
    }

    const customFieldSchemas = caseFields.filter(field => field.is_active).map(mapToFieldSchema);

    const validFieldNames = new Set(
        [...SYSTEM_FIELDS, ...customFieldSchemas].map(f => f.system_name)
    );

    validFieldNames.add('id');
    validFieldNames.add('suite_id');

    const invalidFields: string[] = [];
    for (const key of fieldKeys) {
        if (!validFieldNames.has(key)) {
            invalidFields.push(key);
        }
    }

    if (invalidFields.length > 0) {
        const validKeysList = Array.from(validFieldNames).sort().join(', ');
        const invalidFieldsList = invalidFields.map(f => `'${f}'`).join(', ');
        throw new Error(`Invalid fields provided: ${invalidFieldsList}. Available fields are: ${validKeysList}`);
    }
}
