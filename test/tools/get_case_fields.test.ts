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
            description: 'Whether test is automated',
            configs: [{ options: { is_required: false } }]
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
            description: 'Priority for automation',
            configs: [{ options: { items: '1, P0\n2, P1\n3, P2', is_required: true } }]
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
            description: 'Test components',
            configs: [{ options: { items: '1, UI\n2, API\n3, Database' } }]
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
        expect(result.fields).toBeDefined();
        expect(result.fields.length).toBeGreaterThan(0);
        expect(mockClient.getCaseFields).toHaveBeenCalled();
    });

    test('includes template_ids for template-specific fields', async () => {
        const templateSpecificFields: CaseField[] = [
            {
                id: 5,
                name: 'steps',
                system_name: 'custom_steps',
                label: 'Steps',
                type_id: 3,
                template_ids: [1, 2],
                include_all: false,
                is_active: true,
                description: 'Test steps',
                configs: []
            }
        ];

        getCaseFieldsMock.mockResolvedValue(templateSpecificFields);

        const result = await getCaseFieldsTool.handler({}, mockClient);

        const stepsField = result.fields.find((f: any) => f.system_name === 'custom_steps');
        expect(stepsField.template_ids).toEqual([1, 2]);
    });

    test('handles unknown field type gracefully', async () => {
        const unknownTypeFields: CaseField[] = [
            {
                id: 6,
                name: 'unknown_type',
                system_name: 'custom_unknown_type',
                label: 'Unknown Type Field',
                type_id: 999,
                template_ids: [],
                include_all: true,
                is_active: true,
                description: null,
                configs: []
            }
        ];

        getCaseFieldsMock.mockResolvedValue(unknownTypeFields);

        const result = await getCaseFieldsTool.handler({}, mockClient);

        const unknownField = result.fields.find((f: any) => f.system_name === 'custom_unknown_type');
        expect(unknownField.type).toBe('Unknown (999)');
    });
});

