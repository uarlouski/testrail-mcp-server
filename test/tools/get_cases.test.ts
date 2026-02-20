import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { getCasesTool } from '../../src/tools/get_cases.js';
import { TestRailClient } from '../../src/client/testrail.js';
import { Case } from '../../src/types/testrail.js';

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
        getCasesMock = jest.fn<(projectId: string, sectionId?: string, filter?: Record<string, string>) => Promise<Case[]>>()
            .mockResolvedValue(mockCases);

        getCasesRecursivelyMock = jest.fn<(projectId: string, sectionId: string, filter?: Record<string, string>, excludedSectionNames?: string[]) => Promise<Case[]>>()
            .mockResolvedValue(mockCases);

        mockClient = {
            getCases: getCasesMock,
            getCasesRecursively: getCasesRecursivelyMock
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
});
