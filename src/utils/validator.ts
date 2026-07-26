import { CaseField } from "../tools/cases/types.js";
import { SYSTEM_FIELDS, mapToFieldSchema } from "../tools/cases/get_case_fields.js";
import { isActive } from "./sanitizer.js";
import { TestRailClient } from "../client/testrail.js";

const SUITE_MODE_SINGLE_WITH_BASELINES = 2;
const SUITE_MODE_MULTI = 3;

/**
 * Validates that suite_id is provided when the project uses multiple test suites or baselines (suite_mode=2 or 3).
 * Throws a descriptive Error if suite_id is required but missing.
 */
export async function validateSuiteId(client: TestRailClient, projectId: number, suiteId: number | undefined): Promise<void> {
    if (suiteId) return;

    const project = await client.getProject(projectId);

    if (project.suite_mode === SUITE_MODE_MULTI || project.suite_mode === SUITE_MODE_SINGLE_WITH_BASELINES) {
        throw new Error(
            `Project "${project.name}" (id: ${project.id}) uses multiple test suites/baselines (suite_mode=${project.suite_mode}). ` +
            `The suite_id parameter is required. Use get_suites to find available suites for this project.`
        );
    }
}

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

    const customFieldSchemas = caseFields.filter(isActive).map(mapToFieldSchema);

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
