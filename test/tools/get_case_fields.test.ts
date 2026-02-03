import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { getCaseFieldsTool } from '../../src/tools/get_case_fields.js';
import { TestRailClient } from '../../src/client/testrail.js';
import { CaseField } from '../../src/types/testrail.js';

describe('get_case_fields tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let getCaseFieldsMock: jest.Mock<() => Promise<CaseField[]>>;

    const mockCaseFields: CaseField[] = [
        {
            id: 1,
            name: 'is_automated',
            system_name: 'custom_is_automated',
            label: 'Is Automated',
            type_id: 5,
            template_ids: [],
            include_all: true,
            is_active: true,
            display_order: 1,
            description: 'Whether test is automated',
            configs: [{ context: { is_global: true, project_ids: null }, options: { is_required: false } }]
        },
        {
            id: 2,
            name: 'automation_priority',
            system_name: 'custom_automation_priority',
            label: 'Automation Priority',
            type_id: 6,
            template_ids: [],
            include_all: true,
            is_active: true,
            display_order: 2,
            description: 'Priority for automation',
            configs: [{ context: { is_global: true, project_ids: null }, options: { items: '1, P0\n2, P1\n3, P2', is_required: true } }]
        },
        {
            id: 3,
            name: 'inactive_field',
            system_name: 'custom_inactive_field',
            label: 'Inactive Field',
            type_id: 1,
            template_ids: [],
            include_all: true,
            is_active: false,
            display_order: 3,
            description: null,
            configs: []
        },
        {
            id: 4,
            name: 'components',
            system_name: 'custom_components',
            label: 'Components',
            type_id: 12,
            template_ids: [],
            include_all: true,
            is_active: true,
            display_order: 4,
            description: 'Test components',
            configs: [{ context: { is_global: true, project_ids: null }, options: { items: '1, UI\n2, API\n3, Database' } }]
        }
    ];

    beforeEach(() => {
        getCaseFieldsMock = jest.fn<() => Promise<CaseField[]>>().mockResolvedValue(mockCaseFields);

        mockClient = {
            getCaseFields: getCaseFieldsMock
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(getCaseFieldsTool.name).toBe('get_case_fields');
        expect(getCaseFieldsTool.description).toContain('field schema');
        expect(getCaseFieldsTool.parameters).toBeDefined();
    });

    test('handler fetches and returns field schema', async () => {
        const result = await getCaseFieldsTool.handler({}, mockClient);

        expect(result).toBeDefined();
        expect(result.content[0].type).toBe('text');

        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.fields).toHaveLength(11); // 8 system fields + 3 active custom fields
        expect(mockClient.getCaseFields).toHaveBeenCalled();
    });

    test('returns only essential schema fields', async () => {
        const result = await getCaseFieldsTool.handler({}, mockClient);
        const parsed = JSON.parse(result.content[0].text);

        const field = parsed.fields[0];
        expect(Object.keys(field).sort()).toEqual(['is_required', 'label', 'system_name', 'type']);
    });

    test('returns correct field types', async () => {
        const result = await getCaseFieldsTool.handler({}, mockClient);
        const parsed = JSON.parse(result.content[0].text);

        const checkboxField = parsed.fields.find((f: any) => f.system_name === 'custom_is_automated');
        expect(checkboxField.type).toBe('Checkbox');

        const dropdownField = parsed.fields.find((f: any) => f.system_name === 'custom_automation_priority');
        expect(dropdownField.type).toBe('Dropdown');

        const multiSelectField = parsed.fields.find((f: any) => f.system_name === 'custom_components');
        expect(multiSelectField.type).toBe('Multi-select');
    });

    test('parses dropdown options correctly', async () => {
        const result = await getCaseFieldsTool.handler({}, mockClient);
        const parsed = JSON.parse(result.content[0].text);

        const dropdownField = parsed.fields.find((f: any) => f.system_name === 'custom_automation_priority');
        expect(dropdownField.options).toEqual(['P0', 'P1', 'P2']);

        const multiSelectField = parsed.fields.find((f: any) => f.system_name === 'custom_components');
        expect(multiSelectField.options).toEqual(['UI', 'API', 'Database']);
    });

    test('identifies required fields', async () => {
        const result = await getCaseFieldsTool.handler({}, mockClient);
        const parsed = JSON.parse(result.content[0].text);

        const optionalField = parsed.fields.find((f: any) => f.system_name === 'custom_is_automated');
        expect(optionalField.is_required).toBe(false);

        const requiredField = parsed.fields.find((f: any) => f.system_name === 'custom_automation_priority');
        expect(requiredField.is_required).toBe(true);
    });

    test('filters out inactive fields', async () => {
        const result = await getCaseFieldsTool.handler({}, mockClient);
        const parsed = JSON.parse(result.content[0].text);

        const inactiveField = parsed.fields.find((f: any) => f.system_name === 'custom_inactive_field');
        expect(inactiveField).toBeUndefined();
    });

    test('handler returns error on failure', async () => {
        getCaseFieldsMock.mockRejectedValue(new Error('API Error'));

        const result = await getCaseFieldsTool.handler({}, mockClient);

        expect(result).toEqual({
            content: [{ type: 'text', text: 'Error: API Error' }],
            isError: true
        });
    });
});

