import { jest, describe, test, expect } from '@jest/globals';
import { Case, CaseField } from '../../src/types/testrail.js';
import { processCustomFields } from '../../src/utils/mapper.js';

describe('processCustomFields', () => {

    // Mock CaseField array simulating TestRail API response
    const mockCaseFields: CaseField[] = [
        { id: 1, name: 'is_automated', system_name: 'custom_is_automated', label: 'Is Automated', type_id: 1, template_ids: [], include_all: true, is_active: true, display_order: 1, description: null, configs: [] },
        { id: 2, name: 'refs', system_name: 'custom_refs', label: 'Defects', type_id: 1, template_ids: [], include_all: true, is_active: true, display_order: 2, description: null, configs: [] },
        { id: 3, name: 'case_automation_priority', system_name: 'custom_case_automation_priority', label: 'Automation Priority', type_id: 6, template_ids: [], include_all: true, is_active: true, display_order: 3, description: null, configs: [{ context: { is_global: true, project_ids: null }, options: { items: '2, P0\n3, P1\n4, P2\n5, P3\n6, P4' } }] },
        { id: 4, name: 'preconds', system_name: 'custom_preconds', label: 'Preconditions', type_id: 1, template_ids: [], include_all: true, is_active: true, display_order: 4, description: null, configs: [] },
        { id: 5, name: 'steps', system_name: 'custom_steps', label: 'Steps', type_id: 1, template_ids: [1], include_all: false, is_active: true, display_order: 5, description: null, configs: [] },
        { id: 6, name: 'expected', system_name: 'custom_expected', label: 'Expected', type_id: 1, template_ids: [1], include_all: false, is_active: true, display_order: 6, description: null, configs: [] },
        { id: 7, name: 'steps_separated', system_name: 'custom_steps_separated', label: 'Steps Separated', type_id: 1, template_ids: [2], include_all: false, is_active: true, display_order: 7, description: null, configs: [] },
    ];

    test('maps custom fields using field metadata', () => {
        const input: Case = {
            id: 1, title: 'Foo', template_id: 1,
            section_id: 0, type_id: 0, priority_id: 0,
            custom_is_automated: true,
            custom_refs: 'DEF-123',
            display_order: 1, suite_id: 1, created_by: 1, created_on: 1, updated_by: 1, updated_on: 1,
            is_deleted: 0, refs: null, labels: [],
        } as unknown as Case;

        const result = processCustomFields(input, mockCaseFields);
        expect(result.is_automated).toBe(true);
        expect(result.defects).toBe('DEF-123');
    });

    test('maps fields using value mapping from config', () => {
        const input: Case = {
            id: 1, title: 'Foo', template_id: 1,
            section_id: 0, type_id: 0, priority_id: 0,
            custom_case_automation_priority: 2,
            display_order: 1, suite_id: 1, created_by: 1, created_on: 1, updated_by: 1, updated_on: 1,
            is_deleted: 0, refs: null, labels: [],
        } as unknown as Case;

        const result = processCustomFields(input, mockCaseFields);
        expect(result.automation_priority).toBe('P0');
    });

    test('includes only template-specific fields for template 1', () => {
        const input: Case = {
            id: 1, title: 'Foo', template_id: 1,
            custom_steps: 'Step 1...',
            custom_expected: 'Expectation...',
            custom_steps_separated: [{ content: 'Should not appear' }], // Template 2 field
            section_id: 0, type_id: 0, priority_id: 0,
            display_order: 1, suite_id: 1, created_by: 1, created_on: 1, updated_by: 1, updated_on: 1,
            is_deleted: 0, refs: null, labels: [],
        } as unknown as Case;

        const result = processCustomFields(input, mockCaseFields);
        expect(result.steps).toBe('Step 1...');
        expect(result.expected).toBe('Expectation...');
        expect(result.steps_separated).toBeUndefined(); // Not included for template 1
    });

    test('includes only template-specific fields for template 2', () => {
        const input: Case = {
            id: 1, title: 'Foo', template_id: 2,
            custom_steps: 'Should not appear', // Template 1 field
            custom_steps_separated: [{ content: 'Step 1' }],
            section_id: 0, type_id: 0, priority_id: 0,
            display_order: 1, suite_id: 1, created_by: 1, created_on: 1, updated_by: 1, updated_on: 1,
            is_deleted: 0, refs: null, labels: [],
        } as unknown as Case;

        const result = processCustomFields(input, mockCaseFields);
        expect(result.steps_separated).toEqual([{ content: 'Step 1' }]);
        expect(result.steps).toBeUndefined(); // Not included for template 2
    });

    test('keeps unknown fields as-is when no mapping found', () => {
        const input: Case = {
            id: 1, title: 'Foo', template_id: 999,
            custom_unknown_field: 'some value',
            section_id: 0, type_id: 0, priority_id: 0,
            display_order: 1, suite_id: 1, created_by: 1, created_on: 1, updated_by: 1, updated_on: 1,
            is_deleted: 0, refs: null, labels: [],
        } as unknown as Case;

        const result = processCustomFields(input, mockCaseFields);
        expect(result.custom_unknown_field).toBe('some value'); // Kept as-is with original key
    });
});
