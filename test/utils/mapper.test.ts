import { jest, describe, test, expect } from '@jest/globals';
import { Case, CaseField } from '../../src/types/testrail.js';
import { processCustomFields, parseDropdownOptions, resolveCustomFieldValue } from '../../src/utils/mapper.js';

describe('processCustomFields', () => {

    // Mock CaseField array simulating TestRail API response
    const mockCaseFields: CaseField[] = [
        { id: 1, name: 'is_automated', system_name: 'custom_is_automated', label: 'Is Automated', type_id: 1, template_ids: [], include_all: true, is_active: true, description: null, configs: [] },
        { id: 2, name: 'refs', system_name: 'custom_refs', label: 'Defects', type_id: 1, template_ids: [], include_all: true, is_active: true, description: null, configs: [] },
        { id: 3, name: 'case_automation_priority', system_name: 'custom_case_automation_priority', label: 'Automation Priority', type_id: 6, template_ids: [], include_all: true, is_active: true, description: null, configs: [{ options: { items: '2, P0\n3, P1\n4, P2\n5, P3\n6, P4' } }] },
        { id: 4, name: 'preconds', system_name: 'custom_preconds', label: 'Preconditions', type_id: 1, template_ids: [], include_all: true, is_active: true, description: null, configs: [] },
        { id: 5, name: 'steps', system_name: 'custom_steps', label: 'Steps', type_id: 1, template_ids: [1], include_all: false, is_active: true, description: null, configs: [] },
        { id: 6, name: 'expected', system_name: 'custom_expected', label: 'Expected', type_id: 1, template_ids: [1], include_all: false, is_active: true, description: null, configs: [] },
        { id: 7, name: 'steps_separated', system_name: 'custom_steps_separated', label: 'Steps Separated', type_id: 1, template_ids: [2], include_all: false, is_active: true, description: null, configs: [] },
    ];

    test('maps custom fields using field metadata', () => {
        const input: Case = {
            id: 1, title: 'Foo', template_id: 1,
            section_id: 0, type_id: 0, priority_id: 0,
            custom_is_automated: true,
            custom_refs: 'DEF-123',
            display_order: 1, suite_id: 1, created_on: 1, updated_on: 1,
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
            display_order: 1, suite_id: 1, created_on: 1, updated_on: 1,
            is_deleted: 0, refs: null, labels: [],
        } as unknown as Case;

        const result = processCustomFields(input, mockCaseFields);
        expect(result.automation_priority).toBe('P0');
    });

    test('maps multi-select array field values using config', () => {
        const multiSelectFields: CaseField[] = [
            { id: 8, name: 'browsers', system_name: 'custom_browsers', label: 'Browsers', type_id: 12, template_ids: [], include_all: true, is_active: true, description: null, configs: [{ options: { items: '1, Chrome\n2, Firefox\n3, Safari' } }] },
        ];
        const input: Case = {
            id: 1, title: 'Foo', template_id: 1,
            custom_browsers: [1, 2],
        } as unknown as Case;

        const result = processCustomFields(input, multiSelectFields);
        expect(result.browsers).toEqual(['Chrome', 'Firefox']);
    });

    test('maps single value for multi-select field as array', () => {
        const multiSelectFields: CaseField[] = [
            { id: 8, name: 'browsers', system_name: 'custom_browsers', label: 'Browsers', type_id: 12, template_ids: [], include_all: true, is_active: true, description: null, configs: [{ options: { items: '1, Chrome\n2, Firefox\n3, Safari' } }] },
        ];
        const input: Case = {
            id: 1, title: 'Foo', template_id: 1,
            custom_browsers: 1,
        } as unknown as Case;

        const result = processCustomFields(input, multiSelectFields);
        expect(result.browsers).toEqual(['Chrome']);
    });

    test('normalizes multi-select field without dropdown options configs to array', () => {
        const multiSelectFields: CaseField[] = [
            { id: 9, name: 'tags', system_name: 'custom_tags', label: 'Tags', type_id: 12, template_ids: [], include_all: true, is_active: true, description: null, configs: [] },
        ];
        const input: Case = {
            id: 1, title: 'Foo', template_id: 1,
            custom_tags: 123,
        } as unknown as Case;

        const result = processCustomFields(input, multiSelectFields);
        expect(result.tags).toEqual([123]);
    });

    test('includes only template-specific fields for template 1', () => {
        const input: Case = {
            id: 1, title: 'Foo', template_id: 1,
            custom_steps: 'Step 1...',
            custom_expected: 'Expectation...',
            custom_steps_separated: [{ content: 'Should not appear' }], // Template 2 field
            section_id: 0, type_id: 0, priority_id: 0,
            display_order: 1, suite_id: 1, created_on: 1, updated_on: 1,
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
            display_order: 1, suite_id: 1, created_on: 1, updated_on: 1,
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
            display_order: 1, suite_id: 1, created_on: 1, updated_on: 1,
            is_deleted: 0, refs: null, labels: [],
        } as unknown as Case;

        const result = processCustomFields(input, mockCaseFields);
        expect(result.custom_unknown_field).toBe('some value'); // Kept as-is with original key
    });

    test('ignores null or undefined custom fields', () => {
        const input: Case = {
            id: 1, title: 'Foo', template_id: 1,
            custom_steps: null,
            custom_expected: undefined,
            section_id: 0, type_id: 0, priority_id: 0,
            display_order: 1, suite_id: 1, created_on: 1, updated_on: 1,
            is_deleted: 0, refs: null, labels: [],
        } as unknown as Case;

        const result = processCustomFields(input, mockCaseFields);
        expect(result.steps).toBeUndefined();
        expect(result.expected).toBeUndefined();
    });

    test('throws error when testCase is null', () => {
        expect(() => processCustomFields(null as any, mockCaseFields)).toThrow('Test case is undefined or null');
    });

    test('throws error when testCase is undefined', () => {
        expect(() => processCustomFields(undefined as any, mockCaseFields)).toThrow('Test case is undefined or null');
    });

    test('returns original value when dropdown option is not found', () => {
        const input: Case = {
            id: 1, title: 'Foo', template_id: 1,
            section_id: 0, type_id: 0, priority_id: 0,
            custom_case_automation_priority: 999, // Unknown option ID
            display_order: 1, suite_id: 1, created_on: 1, updated_on: 1,
            is_deleted: 0, refs: null, labels: [],
        } as unknown as Case;

        const result = processCustomFields(input, mockCaseFields);
        expect(result.automation_priority).toBe(999); // Falls back to original value
    });
});

describe('parseDropdownOptions', () => {
    const multiConfigField: CaseField = {
        id: 10,
        name: 'tags',
        system_name: 'custom_tags',
        label: 'Tags',
        type_id: 12,
        template_ids: [],
        include_all: true,
        is_active: true,
        description: null,
        configs: [
            {
                context: { is_global: true, project_ids: [] },
                options: { items: '1, Global 1\n2, Global 2' }
            },
            {
                context: { is_global: false, project_ids: [100] },
                options: { items: '1, Project 100 Option 1\n2, Project 100 Option 2' }
            }
        ]
    };

    test('parses global config when no projectId provided', () => {
        const options = parseDropdownOptions(multiConfigField);
        expect(options.get('1')).toBe('Project 100 Option 1'); // when no projectId given, parses all configs
    });

    test('prioritizes project-specific config when matching projectId provided', () => {
        const options = parseDropdownOptions(multiConfigField, 100);
        expect(options.get('1')).toBe('Project 100 Option 1');
        expect(options.get('2')).toBe('Project 100 Option 2');
    });

    test('falls back to global config when non-matching projectId provided', () => {
        const options = parseDropdownOptions(multiConfigField, 999);
        expect(options.get('1')).toBe('Global 1');
        expect(options.get('2')).toBe('Global 2');
    });
});

describe('resolveCustomFieldValue', () => {
    const stringField: CaseField = {
        id: 1,
        name: 'notes',
        system_name: 'custom_notes',
        label: 'Notes',
        type_id: 1,
        template_ids: [],
        include_all: true,
        is_active: true,
        description: null,
        configs: [],
    };

    const dropdownField: CaseField = {
        id: 2,
        name: 'automation_type',
        system_name: 'custom_automation_type',
        label: 'Automation Type',
        type_id: 6,
        template_ids: [],
        include_all: true,
        is_active: true,
        description: null,
        configs: [{ options: { items: '1, None\n2, Automated\n3, Needs Review' } }],
    };

    const multiSelectField: CaseField = {
        id: 3,
        name: 'browsers',
        system_name: 'custom_browsers',
        label: 'Browsers',
        type_id: 12,
        template_ids: [],
        include_all: true,
        is_active: true,
        description: null,
        configs: [{ options: { items: '1, Chrome\n2, Firefox\n3, Safari' } }],
    };

    test('returns null/undefined as-is', () => {
        expect(resolveCustomFieldValue(stringField, null)).toBeNull();
        expect(resolveCustomFieldValue(stringField, undefined)).toBeUndefined();
    });

    test('resolves dropdown numeric option to label', () => {
        expect(resolveCustomFieldValue(dropdownField, 2)).toBe('Automated');
        expect(resolveCustomFieldValue(dropdownField, '2')).toBe('Automated');
        expect(resolveCustomFieldValue(dropdownField, 999)).toBe(999);
    });

    test('resolves multi-select array and single values to labels', () => {
        expect(resolveCustomFieldValue(multiSelectField, [1, 3])).toEqual(['Chrome', 'Safari']);
        expect(resolveCustomFieldValue(multiSelectField, 1)).toEqual(['Chrome']);
    });

    test('sanitizes HTML in string values', () => {
        expect(resolveCustomFieldValue(stringField, '<p>Hello <strong>World</strong></p>')).toBe('Hello **World**');
    });
});

