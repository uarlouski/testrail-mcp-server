import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { getCasesTool } from '../../src/tools/get_cases.js';
import { TestRailClient } from '../../src/client/testrail.js';
import { Case } from '../../src/types/testrail.js';

describe('get_cases tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let getCasesMock: jest.Mock<(projectId: string, sectionId?: string, filter?: Record<string, string>) => Promise<Case[]>>;

    const mockCases: Case[] = [
        {
            id: 1, title: 'Login test', section_id: 1, template_id: 1, type_id: 1,
            priority_id: 2, milestone_id: null, refs: null, created_by: 1, created_on: 1700000000,
            updated_by: 1, updated_on: 1700000000, estimate: null, estimate_forecast: null,
            suite_id: 1, display_order: 1, is_deleted: 0, labels: [], custom_automation_status: 1
        },
        {
            id: 2, title: 'Logout test', section_id: 1, template_id: 1, type_id: 1,
            priority_id: 3, milestone_id: null, refs: null, created_by: 1, created_on: 1700000000,
            updated_by: 1, updated_on: 1700000000, estimate: null, estimate_forecast: null,
            suite_id: 1, display_order: 2, is_deleted: 0, labels: [], custom_automation_status: 2
        },
        {
            id: 3, title: 'Registration test', section_id: 2, template_id: 1, type_id: 1,
            priority_id: 1, milestone_id: null, refs: null, created_by: 1, created_on: 1700000000,
            updated_by: 1, updated_on: 1700000000, estimate: null, estimate_forecast: null,
            suite_id: 1, display_order: 3, is_deleted: 0, labels: [], custom_automation_status: 0
        },
    ];

    beforeEach(() => {
        getCasesMock = jest.fn<(projectId: string, sectionId?: string, filter?: Record<string, string>) => Promise<Case[]>>()
            .mockResolvedValue(mockCases);

        mockClient = {
            getCases: getCasesMock
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(getCasesTool.name).toBe('get_cases');
        expect(getCasesTool.description).toContain('cases');
        expect(getCasesTool.parameters).toBeDefined();
        expect(getCasesTool.parameters.project_id).toBeDefined();
        expect(getCasesTool.parameters.section_id).toBeDefined();
        expect(getCasesTool.parameters.filter).toBeDefined();
        expect(getCasesTool.parameters.fields).toBeDefined();
    });

    test('handler fetches and returns cases', async () => {
        const result = await getCasesTool.handler({ project_id: '1' }, mockClient);

        expect(result).toBeDefined();
        expect(result.content[0].type).toBe('text');

        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.cases).toHaveLength(3);
        expect(mockClient.getCases).toHaveBeenCalledWith('1', undefined, undefined);
    });

    test('passes section_id when provided', async () => {
        await getCasesTool.handler({ project_id: '1', section_id: '2' }, mockClient);

        expect(mockClient.getCases).toHaveBeenCalledWith('1', '2', undefined);
    });

    test('passes filter when provided', async () => {
        const filter = { priority_id: '1,2', type_id: '3' };
        await getCasesTool.handler({ project_id: '1', filter }, mockClient);

        expect(mockClient.getCases).toHaveBeenCalledWith('1', undefined, filter);
    });

    test('returns correct case structure', async () => {
        const result = await getCasesTool.handler({ project_id: '1' }, mockClient);
        const parsed = JSON.parse(result.content[0].text);

        expect(parsed.cases[0]).toEqual({
            id: 1,
            title: 'Login test',
            suite_id: 1,
        });

        expect(parsed.cases[2]).toEqual({
            id: 3,
            title: 'Registration test',
            suite_id: 1,
        });
    });

    test('includes additional fields when specified', async () => {
        const result = await getCasesTool.handler(
            { project_id: '1', fields: ['priority_id', 'type_id', 'custom_automation_status'] },
            mockClient
        );
        const parsed = JSON.parse(result.content[0].text);

        expect(parsed.cases[0]).toEqual({
            id: 1,
            title: 'Login test',
            suite_id: 1,
            priority_id: 2,
            type_id: 1,
            custom_automation_status: 1,
        });

        expect(parsed.cases[1]).toEqual({
            id: 2,
            title: 'Logout test',
            suite_id: 1,
            priority_id: 3,
            type_id: 1,
            custom_automation_status: 2,
        });
    });

    test('ignores non-existent fields', async () => {
        const result = await getCasesTool.handler(
            { project_id: '1', fields: ['priority_id', 'nonexistent_field'] },
            mockClient
        );
        const parsed = JSON.parse(result.content[0].text);

        expect(parsed.cases[0]).toEqual({
            id: 1,
            title: 'Login test',
            suite_id: 1,
            priority_id: 2,
        });
    });

    test('handler returns error on failure', async () => {
        getCasesMock.mockRejectedValue(new Error('API Error'));

        const result = await getCasesTool.handler({ project_id: '1' }, mockClient);

        expect(result).toEqual({
            content: [{ type: 'text', text: 'Error: API Error' }],
            isError: true
        });
    });

    test('filters cases using where clause with single condition', async () => {
        const result = await getCasesTool.handler(
            { project_id: '1', where: { custom_automation_status: 1 } },
            mockClient
        );
        const parsed = JSON.parse(result.content[0].text);

        expect(parsed.cases).toHaveLength(1);
        expect(parsed.cases[0].id).toBe(1);
        expect(parsed.cases[0].title).toBe('Login test');
    });

    test('filters cases using where clause with multiple conditions', async () => {
        const result = await getCasesTool.handler(
            { project_id: '1', where: { custom_automation_status: 2, priority_id: 3 } },
            mockClient
        );
        const parsed = JSON.parse(result.content[0].text);

        expect(parsed.cases).toHaveLength(1);
        expect(parsed.cases[0].id).toBe(2);
        expect(parsed.cases[0].title).toBe('Logout test');
    });

    test('returns empty array when where clause matches no cases', async () => {
        const result = await getCasesTool.handler(
            { project_id: '1', where: { custom_automation_status: 999 } },
            mockClient
        );
        const parsed = JSON.parse(result.content[0].text);

        expect(parsed.cases).toHaveLength(0);
    });

    test('combines where clause with fields parameter', async () => {
        const result = await getCasesTool.handler(
            { project_id: '1', where: { priority_id: 2 }, fields: ['priority_id', 'custom_automation_status'] },
            mockClient
        );
        const parsed = JSON.parse(result.content[0].text);

        expect(parsed.cases).toHaveLength(1);
        expect(parsed.cases[0]).toEqual({
            id: 1,
            title: 'Login test',
            suite_id: 1,
            priority_id: 2,
            custom_automation_status: 1
        });
    });
});
