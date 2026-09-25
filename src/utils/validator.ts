import { CaseField } from "../tools/cases/types.js";
import { SYSTEM_FIELDS, READONLY_CASE_FIELDS, mapToFieldSchema } from "../tools/cases/get_case_fields.js";
import { isActive } from "./sanitizer.js";
import { TestRailClient } from "../client/testrail.js";

const SUITE_MODE_SINGLE_WITH_BASELINES = 2;
const SUITE_MODE_MULTI = 3;

/**
 * Options for case field validation.
 */
export interface ValidateCaseFieldsOptions {
    /**
     * Whether to allow read-only system metadata fields (e.g. updated_on, created_on, id, suite_id).
     * Defaults to true for query/filter contexts. Should be false for write operations (add/update).
     */
    allowReadonly?: boolean;
}

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
            `The suite_id parameter is required. Use query_suite to find available suites for this project.`
        );
    }
}

/**
 * Validates that the provided fields exist in the TestRail case schema.
 * Throws an Error if any field is invalid.
 * 
 * @param fields A record of fields or array of field names to validate
 * @param caseFields Available custom case fields from TestRail
 * @param options Validation options (e.g. allowReadonly)
 */
export function validateCaseFields(
    fields: Record<string, any> | string[],
    caseFields: CaseField[],
    options: ValidateCaseFieldsOptions = { allowReadonly: true }
): void {
    const fieldKeys = Array.isArray(fields) ? fields : Object.keys(fields);

    if (fieldKeys.length === 0) {
        return;
    }

    const customFieldSchemas = caseFields.filter(isActive).map(mapToFieldSchema);

    const validFieldNames = new Set(
        [...SYSTEM_FIELDS, ...customFieldSchemas].map(f => f.system_name)
    );

    if (options.allowReadonly !== false) {
        for (const field of READONLY_CASE_FIELDS) {
            validFieldNames.add(field);
        }
    }

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

