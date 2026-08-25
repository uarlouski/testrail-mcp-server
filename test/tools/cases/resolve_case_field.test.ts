import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { resolveCaseFieldTool } from '../../../src/tools/cases/resolve_case_field.js';
import { TestRailClient } from '../../../src/client/testrail.js';
import { CaseField } from '../../../src/tools/cases/types.js';

describe('resolve_case_field tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let getCaseFieldsMock: jest.Mock<() => Promise<CaseField[]>>;

    const mockCaseFields: CaseField[] = [
        {
            id: 1,
            name: 'case_feature_tags',
            system_name: 'custom_case_feature_tags',
            label: 'Case Feature Tags',
            type_id: 12,
            template_ids: [],
            include_all: true,
            is_active: true,
            description: 'Tags for features',
            configs: [
                {
                    context: { is_global: true, project_ids: [] },
                    options: { items: '1, Authentication\n55, Settings\n6, Billing' }
                }
            ]
        },
        {
            id: 2,
            name: 'project_specific_multi',
            system_name: 'custom_project_specific_multi',
            label: 'Project Specific Multi',
            type_id: 12,
            template_ids: [],
            include_all: true,
            is_active: true,
            description: null,
            configs: [
                {
                    context: { is_global: false, project_ids: [10] },
                    options: { items: '1, P10 Item 1\n2, P10 Item 2' }
                }
            ]
        },
        {
            id: 3,
            name: 'dropdown_field',
            system_name: 'custom_dropdown_field',
            label: 'Dropdown Field',
            type_id: 6,
            template_ids: [],
            include_all: true,
            is_active: true,
            description: null,
            configs: [
                {
                    context: { is_global: true, project_ids: [] },
                    options: { items: '1, Dropdown Option 1' }
                }
            ]
        },
        {
            id: 4,
            name: 'inactive_multi',
            system_name: 'custom_inactive_multi',
            label: 'Inactive Multi',
            type_id: 12,
            template_ids: [],
            include_all: true,
            is_active: false,
            description: null,
            configs: [
                {
                    context: { is_global: true, project_ids: [] },
                    options: { items: '1, Old Item' }
                }
            ]
        }
    ];

    beforeEach(() => {
        getCaseFieldsMock = jest.fn<() => Promise<CaseField[]>>().mockResolvedValue(mockCaseFields);

        mockClient = {
            getCaseFields: getCaseFieldsMock
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(resolveCaseFieldTool.name).toBe('resolve_case_field');
        expect(resolveCaseFieldTool.mode).toBe('read');
        expect(resolveCaseFieldTool.description).toContain('Multi-select case field (type ID 12)');
        expect(resolveCaseFieldTool.parameters).toBeDefined();
    });

    test('resolves array of refs for a Multi-select field using system_name', async () => {
        const result = await resolveCaseFieldTool.handler(
            {
                project_id: 1,
                field_name: 'custom_case_feature_tags',
                refs: [1, 55, 6]
            },
            mockClient
        );

        expect(result).toEqual({
            field_name: 'custom_case_feature_tags',
            resolved: [
                { id: 1, value: 'Authentication' },
                { id: 55, value: 'Settings' },
                { id: 6, value: 'Billing' }
            ]
        });
    });

    test('resolves single numeric ref for a Multi-select field', async () => {
        const result = await resolveCaseFieldTool.handler(
            {
                project_id: 1,
                field_name: 'custom_case_feature_tags',
                refs: 55
            },
            mockClient
        );

        expect(result).toEqual({
            field_name: 'custom_case_feature_tags',
            resolved: [{ id: 55, value: 'Settings' }]
        });
    });

    test('matches system_name case-insensitively', async () => {
        const result = await resolveCaseFieldTool.handler(
            {
                project_id: 1,
                field_name: 'CUSTOM_CASE_FEATURE_TAGS',
                refs: [1]
            },
            mockClient
        );

        expect(result.resolved).toEqual([{ id: 1, value: 'Authentication' }]);
    });

    test('throws error if field_name is label instead of system_name', async () => {
        await expect(
            resolveCaseFieldTool.handler(
                {
                    project_id: 1,
                    field_name: 'Case Feature Tags',
                    refs: [6]
                },
                mockClient
            )
        ).rejects.toThrow("Field 'Case Feature Tags' not found in active case fields.");
    });

    test('throws error if field_name omits custom_ prefix from system_name', async () => {
        await expect(
            resolveCaseFieldTool.handler(
                {
                    project_id: 1,
                    field_name: 'case_feature_tags',
                    refs: [1]
                },
                mockClient
            )
        ).rejects.toThrow("Field 'case_feature_tags' not found in active case fields.");
    });

    test('handles unknown ref IDs gracefully with null value', async () => {
        const result = await resolveCaseFieldTool.handler(
            {
                project_id: 1,
                field_name: 'custom_case_feature_tags',
                refs: [1, 999]
            },
            mockClient
        );

        expect(result.resolved).toEqual([
            { id: 1, value: 'Authentication' },
            { id: 999, value: null }
        ]);
    });

    test('resolves project-specific Multi-select field for valid project_id', async () => {
        const result = await resolveCaseFieldTool.handler(
            {
                project_id: 10,
                field_name: 'custom_project_specific_multi',
                refs: [1, 2]
            },
            mockClient
        );

        expect(result.resolved).toEqual([
            { id: 1, value: 'P10 Item 1' },
            { id: 2, value: 'P10 Item 2' }
        ]);
    });

    test('throws error if field is not enabled for project_id', async () => {
        await expect(
            resolveCaseFieldTool.handler(
                {
                    project_id: 99,
                    field_name: 'custom_project_specific_multi',
                    refs: [1]
                },
                mockClient
            )
        ).rejects.toThrow("Field 'custom_project_specific_multi' is not enabled for project ID 99.");
    });

    test('throws error if field is not found', async () => {
        await expect(
            resolveCaseFieldTool.handler(
                {
                    project_id: 1,
                    field_name: 'non_existent_field',
                    refs: [1]
                },
                mockClient
            )
        ).rejects.toThrow("Field 'non_existent_field' not found in active case fields.");
    });

    test('throws error if field is inactive', async () => {
        await expect(
            resolveCaseFieldTool.handler(
                {
                    project_id: 1,
                    field_name: 'custom_inactive_multi',
                    refs: [1]
                },
                mockClient
            )
        ).rejects.toThrow("Field 'custom_inactive_multi' not found in active case fields.");
    });

    test('throws error if field is not Multi-select (type_id !== 12)', async () => {
        await expect(
            resolveCaseFieldTool.handler(
                {
                    project_id: 1,
                    field_name: 'custom_dropdown_field',
                    refs: [1]
                },
                mockClient
            )
        ).rejects.toThrow("Field 'custom_dropdown_field' is of type_id 6, but resolve_case_field only supports Multi-select fields (type_id: 12).");
    });
});
