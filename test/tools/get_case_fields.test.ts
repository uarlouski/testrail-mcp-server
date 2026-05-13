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
            configs: [{ context: { is_global: true, project_ids: [] }, options: { is_required: false } }]
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
            configs: [{ context: { is_global: false, project_ids: [1, 2] }, options: { items: '1, P0\n2, P1\n3, P2', is_required: true } }]
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
            configs: [{ context: { is_global: false, project_ids: [3] }, options: { items: '1, UI\n2, API\n3, Database' } }]
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
        expect(getCaseFieldsTool.description).toContain('You should normally provide project_id to get fields applicable to your project.');
        expect(getCaseFieldsTool.parameters).toBeDefined();
    });

    test('handler returns all active fields when no project_id given', async () => {
        const result = await getCaseFieldsTool.handler({}, mockClient);

        expect(result).toBeDefined();
        expect(result.fields).toBeDefined();
        expect(mockClient.getCaseFields).toHaveBeenCalled();

        const systemNames = result.fields.map((f: any) => f.system_name);
        expect(systemNames).toContain('custom_is_automated');
        expect(systemNames).toContain('custom_automation_priority');
        expect(systemNames).toContain('custom_components');
        expect(systemNames).not.toContain('custom_inactive_field');
    });

    test('returned fields include project_scope aggregated from all configs when context is present', async () => {
        const result = await getCaseFieldsTool.handler({}, mockClient);

        const globalField = result.fields.find((f: any) => f.system_name === 'custom_is_automated');
        expect(globalField.project_scope).toEqual({ scope: 'global' });

        const scopedField = result.fields.find((f: any) => f.system_name === 'custom_automation_priority');
        expect(scopedField.project_scope).toEqual({ scope: 'projects', project_ids: [1, 2] });
    });

    test('project_scope aggregates project_ids across multiple configs', async () => {
        const multiConfigField: CaseField[] = [
            {
                id: 33,
                name: 'ai_generated',
                system_name: 'custom_case_ai_generated',
                label: 'ai_generated',
                type_id: 5,
                template_ids: [],
                include_all: true,
                is_active: true,
                description: null,
                configs: [
                    { context: { is_global: false, project_ids: [10] }, options: { is_required: false } },
                    { context: { is_global: false, project_ids: [8] }, options: { is_required: false } },
                ]
            }
        ];
        getCaseFieldsMock.mockResolvedValue(multiConfigField);

        const result = await getCaseFieldsTool.handler({}, mockClient);

        const field = result.fields.find((f: any) => f.system_name === 'custom_case_ai_generated');
        expect(field.project_scope).toEqual({ scope: 'projects', project_ids: [10, 8] });
    });

    test('isFieldForProject matches any config across multiple configs', async () => {
        const multiConfigField: CaseField[] = [
            {
                id: 33,
                name: 'ai_generated',
                system_name: 'custom_case_ai_generated',
                label: 'ai_generated',
                type_id: 5,
                template_ids: [],
                include_all: true,
                is_active: true,
                description: null,
                configs: [
                    { context: { is_global: false, project_ids: [10] }, options: {} },
                    { context: { is_global: false, project_ids: [8] }, options: {} },
                ]
            }
        ];
        getCaseFieldsMock.mockResolvedValue(multiConfigField);

        const forProject8 = await getCaseFieldsTool.handler({ project_id: 8 }, mockClient);
        expect(forProject8.fields.find((f: any) => f.system_name === 'custom_case_ai_generated')).toBeDefined();

        const forProject10 = await getCaseFieldsTool.handler({ project_id: 10 }, mockClient);
        expect(forProject10.fields.find((f: any) => f.system_name === 'custom_case_ai_generated')).toBeDefined();

        const forProject99 = await getCaseFieldsTool.handler({ project_id: 99 }, mockClient);
        expect(forProject99.fields.find((f: any) => f.system_name === 'custom_case_ai_generated')).toBeUndefined();
    });

    test('returned fields omit project_scope when context is absent', async () => {
        const noContextFields: CaseField[] = [
            {
                id: 8,
                name: 'no_context',
                system_name: 'custom_no_context',
                label: 'No Context',
                type_id: 1,
                template_ids: [],
                include_all: true,
                is_active: true,
                description: null,
                configs: [{ options: {} }]
            }
        ];
        getCaseFieldsMock.mockResolvedValue(noContextFields);

        const result = await getCaseFieldsTool.handler({}, mockClient);

        const field = result.fields.find((f: any) => f.system_name === 'custom_no_context');
        expect(field.project_scope).toBeUndefined();
    });

    test('handler filters to global and project-specific fields when project_id given', async () => {
        const result = await getCaseFieldsTool.handler({ project_id: 1 }, mockClient);

        const systemNames = result.fields.map((f: any) => f.system_name);
        // global field — should be included
        expect(systemNames).toContain('custom_is_automated');
        // scoped to projects [1, 2] — should be included for project 1
        expect(systemNames).toContain('custom_automation_priority');
        // scoped to project [3] only — should be excluded for project 1
        expect(systemNames).not.toContain('custom_components');
        // inactive — always excluded
        expect(systemNames).not.toContain('custom_inactive_field');
    });

    test('handler excludes project-scoped fields not matching project_id', async () => {
        const result = await getCaseFieldsTool.handler({ project_id: 3 }, mockClient);

        const systemNames = result.fields.map((f: any) => f.system_name);
        expect(systemNames).toContain('custom_is_automated');        // global
        expect(systemNames).toContain('custom_components');          // scoped to [3]
        expect(systemNames).not.toContain('custom_automation_priority'); // scoped to [1,2]
    });

    test('project_scope is omitted from all fields when project_id is provided', async () => {
        const result = await getCaseFieldsTool.handler({ project_id: 1 }, mockClient);

        for (const field of result.fields) {
            expect((field as any).project_scope).toBeUndefined();
        }
    });

    test('project_scope is present on fields when no project_id is provided', async () => {
        const result = await getCaseFieldsTool.handler({}, mockClient);

        // system fields always have scope
        const titleField = result.fields.find((f: any) => f.system_name === 'title');
        expect(titleField.project_scope).toEqual({ scope: 'global' });

        // custom global field
        const globalCustom = result.fields.find((f: any) => f.system_name === 'custom_is_automated');
        expect(globalCustom.project_scope).toEqual({ scope: 'global' });

        // custom scoped field
        const scopedCustom = result.fields.find((f: any) => f.system_name === 'custom_automation_priority');
        expect(scopedCustom.project_scope).toEqual({ scope: 'projects', project_ids: [1, 2] });
    });

    test('fields without context are included regardless of project_id', async () => {
        const noContextFields: CaseField[] = [
            {
                id: 7,
                name: 'no_context',
                system_name: 'custom_no_context',
                label: 'No Context Field',
                type_id: 1,
                template_ids: [],
                include_all: true,
                is_active: true,
                description: null,
                configs: [{ options: {} }]
            }
        ];

        getCaseFieldsMock.mockResolvedValue(noContextFields);

        const result = await getCaseFieldsTool.handler({ project_id: 42 }, mockClient);

        const systemNames = result.fields.map((f: any) => f.system_name);
        expect(systemNames).toContain('custom_no_context');
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
