import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { getCasesTool } from '../../../src/tools/cases/get_cases.js';
import { TestRailClient } from '../../../src/client/testrail.js';
import { Case } from '../../../src/tools/cases/types.js';
import fs from 'fs';

describe('get_cases tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let getCasesMock: jest.Mock<(projectId: string, sectionId?: string, filter?: Record<string, string>) => Promise<Case[]>>;
    let getCasesRecursivelyMock: jest.Mock<(projectId: string, sectionId: string, filter?: Record<string, string>, excludedSectionNames?: string[]) => Promise<Case[]>>;

    const mockCases: Case[] = [
        {
            id: 1, title: 'Login test', section_id: 1, template_id: 1, type_id: 1,
            priority_id: 2, milestone_id: null, refs: null, created_on: 1700000000,
            updated_by: 1, updated_on: 1700000000, estimate: null,
            suite_id: 1, labels: [], custom_automation_status: 1
        },
        {
            id: 2, title: 'Logout test', section_id: 1, template_id: 1, type_id: 1,
            priority_id: 3, milestone_id: null, refs: null, created_on: 1700000000,
            updated_by: 1, updated_on: 1700000000, estimate: null,
            suite_id: 1, labels: [], custom_automation_status: 2
        },
        {
            id: 3, title: 'Registration test', section_id: 2, template_id: 1, type_id: 1,
            priority_id: 1, milestone_id: null, refs: null, created_on: 1700000000,
            updated_by: 1, updated_on: 1700000000, estimate: null,
            suite_id: 1, labels: [], custom_automation_status: 0
        },
    ];

    beforeEach(() => {
        jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);

        getCasesMock = jest.fn<(projectId: string, sectionId?: string, filter?: Record<string, string>) => Promise<Case[]>>()
            .mockResolvedValue(mockCases);

        getCasesRecursivelyMock = jest.fn<(projectId: string, sectionId: string, filter?: Record<string, string>, excludedSectionNames?: string[]) => Promise<Case[]>>()
            .mockResolvedValue(mockCases);

        mockClient = {
            getCases: getCasesMock,
            getCasesRecursively: getCasesRecursivelyMock,
            getCaseFields: (jest.fn() as unknown as any).mockResolvedValue([{ system_name: 'priority_id', is_active: true, configs: [], include_all: true, template_ids: [] }, { system_name: 'custom_automation_status', is_active: true, configs: [], include_all: true, template_ids: [] }]),
            getProject: (jest.fn() as unknown as any).mockResolvedValue({ id: 1, name: 'Test Project', is_completed: false, suite_mode: 1 }),
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(getCasesTool.name).toBe('get_cases');
        expect(getCasesTool.description).toContain('cases');
        expect(getCasesTool.parameters).toBeDefined();
        expect(getCasesTool.parameters.project_id).toBeDefined();
        expect(getCasesTool.parameters.section).toBeDefined();
        expect(getCasesTool.parameters.filter).toBeDefined();
        expect(getCasesTool.parameters.fields).toBeDefined();
    });

    test('handler fetches and returns cases', async () => {
        const result = await getCasesTool.handler({ project_id: 1 }, mockClient);

        expect(result).toBeDefined();
        expect(result.cases).toHaveLength(3);
        expect(mockClient.getCases).toHaveBeenCalledWith(1, undefined, undefined);
    });

    test('handler fetches cases for section', async () => {
        const result = await getCasesTool.handler({ project_id: 1, section: { id: 5, recursive: false } }, mockClient);

        expect(result).toBeDefined();
        expect(mockClient.getCases).toHaveBeenCalledWith(1, 5, undefined);
    });

    test('handler fetches cases recursively', async () => {
        const result = await getCasesTool.handler({ project_id: 1, section: { id: 5, recursive: true } }, mockClient);

        expect(result).toBeDefined();
        expect(mockClient.getCasesRecursively).toHaveBeenCalledWith(1, 5, undefined, undefined);
        expect(mockClient.getCases).not.toHaveBeenCalled();
    });

    test('handler fetches cases recursively with exclusion', async () => {
        const result = await getCasesTool.handler({ project_id: 1, section: { id: 5, recursive: true, excludes: ['Skip'] } }, mockClient);

        expect(result).toBeDefined();
        expect(mockClient.getCasesRecursively).toHaveBeenCalledWith(1, 5, undefined, ['Skip']);
    });

    test('filters cases using where clause with single condition', async () => {
        const result = await getCasesTool.handler(
            { project_id: 1, where: { custom_automation_status: 1 } },
            mockClient
        );

        expect(result.cases).toHaveLength(1);
        expect(result.cases[0].id).toBe(1);
        expect(result.cases[0].title).toBe('Login test');
    });

    test('filters cases using where clause with multiple conditions', async () => {
        const result = await getCasesTool.handler(
            { project_id: 1, where: { custom_automation_status: 2, priority_id: 3 } },
            mockClient
        );

        expect(result.cases).toHaveLength(1);
        expect(result.cases[0].id).toBe(2);
        expect(result.cases[0].title).toBe('Logout test');
    });

    test('returns empty array when where clause matches no cases', async () => {
        const result = await getCasesTool.handler(
            { project_id: 1, where: { custom_automation_status: 999 } },
            mockClient
        );

        expect(result.cases).toHaveLength(0);
    });

    test('combines where clause with fields parameter', async () => {
        const result = await getCasesTool.handler(
            { project_id: 1, where: { priority_id: 2 }, fields: ['priority_id', 'custom_automation_status'] },
            mockClient
        );

        expect(result.cases).toHaveLength(1);
        expect(result.cases[0]).toEqual({
            id: 1,
            title: 'Login test',
            suite_id: 1,
            priority_id: 2,
            custom_automation_status: 1,
        });
    });

    test('supports system metadata fields such as updated_on and created_on in fields parameter', async () => {
        const result = await getCasesTool.handler(
            { project_id: 1, fields: ['updated_on', 'created_on', 'updated_by'] },
            mockClient
        );

        expect(result.cases).toHaveLength(3);
        expect(result.cases[0]).toEqual({
            id: 1,
            title: 'Login test',
            suite_id: 1,
            updated_on: 1700000000,
            created_on: 1700000000,
            updated_by: 1,
        });
    });

    test('saves output to file if output_file is provided', async () => {
        const result = await getCasesTool.handler(
            { project_id: 1, output_file: '/tmp/test_cases.json' },
            mockClient
        );

        expect(result.success).toBe(true);
        expect(result.file).toBe('/tmp/test_cases.json');
        expect(result.message).toContain('3 cases');
        expect(result.cases).toBeUndefined();
        
        expect(fs.promises.writeFile).toHaveBeenCalledWith(
            '/tmp/test_cases.json',
            expect.any(String),
            'utf-8'
        );
        
        // Verify JSON string contains the data
        const writtenJson = (fs.promises.writeFile as jest.Mock).mock.calls[0][1] as string;
        const parsed = JSON.parse(writtenJson);
        expect(parsed.cases).toHaveLength(3);
        expect(parsed.cases[0].title).toBe('Login test');
    });

    test('injects suite_id into filter for multi-suite projects', async () => {
        const result = await getCasesTool.handler(
            { project_id: 1, suite_id: 10 },
            mockClient
        );

        expect(result).toBeDefined();
        expect(mockClient.getCases).toHaveBeenCalledWith(1, undefined, { suite_id: '10' });
    });

    test('injects suite_id into existing filter for multi-suite projects', async () => {
        const result = await getCasesTool.handler(
            { project_id: 1, suite_id: 10, filter: { priority_id: '1' } },
            mockClient
        );

        expect(result).toBeDefined();
        expect(mockClient.getCases).toHaveBeenCalledWith(1, undefined, { priority_id: '1', suite_id: '10' });
    });

    test('passes suite_id in filter to getCasesRecursively', async () => {
        const result = await getCasesTool.handler(
            { project_id: 1, suite_id: 10, section: { id: 5, recursive: true } },
            mockClient
        );

        expect(result).toBeDefined();
        expect(mockClient.getCasesRecursively).toHaveBeenCalledWith(1, 5, { suite_id: '10' }, undefined);
    });

    test('does not inject suite_id when not provided', async () => {
        const result = await getCasesTool.handler(
            { project_id: 1, filter: { priority_id: '2' } },
            mockClient
        );

        expect(result).toBeDefined();
        expect(mockClient.getCases).toHaveBeenCalledWith(1, undefined, { priority_id: '2' });
    });

    test('exports suite_id parameter in tool definition', () => {
        expect(getCasesTool.parameters.suite_id).toBeDefined();
    });

    test('fields parameter excludes non-existent fields from output', async () => {
        const result = await getCasesTool.handler(
            { project_id: 1, fields: ['priority_id', 'custom_automation_status'] },
            mockClient
        );

        // All cases should include the requested fields that exist
        expect(result.cases[0]).toEqual({
            id: 1,
            title: 'Login test',
            suite_id: 1,
            priority_id: 2,
            custom_automation_status: 1,
        });
    });

    test('fields parameter skips fields not present on the case object', async () => {
        // Mock a case missing certain fields
        const sparseCase: Case[] = [
            {
                id: 10, title: 'Sparse case', section_id: 1, template_id: 1, type_id: 1,
                priority_id: 2, milestone_id: null, refs: null, created_on: 1700000000,
                updated_by: 1, updated_on: 1700000000, estimate: null,
                suite_id: 1, labels: [], custom_automation_status: 1
            },
        ];
        getCasesMock.mockResolvedValue(sparseCase);

        // Override getCaseFields to include a nonexistent field
        mockClient.getCaseFields = (jest.fn() as unknown as any).mockResolvedValue([
            { system_name: 'priority_id', is_active: true, configs: [], include_all: true, template_ids: [] },
            { system_name: 'nonexistent_field', is_active: true, configs: [], include_all: true, template_ids: [] },
        ]);

        const result = await getCasesTool.handler(
            { project_id: 1, fields: ['priority_id', 'nonexistent_field'] },
            mockClient
        );

        // nonexistent_field should not appear in the output
        expect(result.cases[0]).toEqual({
            id: 10,
            title: 'Sparse case',
            suite_id: 1,
            priority_id: 2,
        });
        expect(result.cases[0]).not.toHaveProperty('nonexistent_field');
    });
});
