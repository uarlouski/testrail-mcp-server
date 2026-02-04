import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { updateCasesTool } from '../../src/tools/update_cases.js';
import { TestRailClient } from '../../src/client/testrail.js';
import { Case } from '../../src/types/testrail.js';

describe('update_cases tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let updateCasesMock: jest.Mock<(suiteId: string, caseIds: number[], fields: Record<string, any>) => Promise<Case[]>>;

    const mockUpdatedCases: Case[] = [
        {
            id: 1, title: 'Test Case 1', section_id: 1, template_id: 1, type_id: 1,
            priority_id: 3, milestone_id: null, refs: null, created_by: 1, created_on: 1700000000,
            updated_by: 1, updated_on: 1700000001, estimate: null, estimate_forecast: null,
            suite_id: 1, display_order: 1, is_deleted: 0, labels: []
        },
        {
            id: 2, title: 'Test Case 2', section_id: 1, template_id: 1, type_id: 1,
            priority_id: 3, milestone_id: null, refs: null, created_by: 1, created_on: 1700000000,
            updated_by: 1, updated_on: 1700000001, estimate: null, estimate_forecast: null,
            suite_id: 1, display_order: 2, is_deleted: 0, labels: []
        },
        {
            id: 3, title: 'Test Case 3', section_id: 1, template_id: 1, type_id: 1,
            priority_id: 3, milestone_id: null, refs: null, created_by: 1, created_on: 1700000000,
            updated_by: 1, updated_on: 1700000001, estimate: null, estimate_forecast: null,
            suite_id: 1, display_order: 3, is_deleted: 0, labels: []
        },
    ];

    beforeEach(() => {
        updateCasesMock = jest.fn<(suiteId: string, caseIds: number[], fields: Record<string, any>) => Promise<Case[]>>()
            .mockResolvedValue(mockUpdatedCases);

        mockClient = {
            updateCases: updateCasesMock
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(updateCasesTool.name).toBe('update_cases');
        expect(updateCasesTool.description).toContain('Bulk');
        expect(updateCasesTool.parameters).toBeDefined();
        expect(updateCasesTool.parameters.suite_id).toBeDefined();
        expect(updateCasesTool.parameters.case_ids).toBeDefined();
        expect(updateCasesTool.parameters.fields).toBeDefined();
    });

    test('handler updates cases and returns success response', async () => {
        const result = await updateCasesTool.handler(
            { suite_id: '1', case_ids: [1, 2, 3], fields: { priority_id: 3 } },
            mockClient
        );

        expect(result).toBeDefined();
        expect(result.content[0].type).toBe('text');

        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.success).toBe(true);
        expect(parsed.updated_count).toBe(3);
        expect(parsed.case_ids).toEqual([1, 2, 3]);
        expect(parsed.message).toContain('3 test cases');
    });

    test('passes suite_id, case_ids and fields correctly', async () => {
        const fields = { priority_id: 2, type_id: 1 };

        await updateCasesTool.handler(
            { suite_id: '5', case_ids: [10, 20, 30], fields },
            mockClient
        );

        expect(mockClient.updateCases).toHaveBeenCalledWith('5', [10, 20, 30], fields);
    });

    test('handler returns error on failure', async () => {
        updateCasesMock.mockRejectedValue(new Error('API Error'));

        const result = await updateCasesTool.handler(
            { suite_id: '1', case_ids: [1, 2], fields: { priority_id: 2 } },
            mockClient
        );

        expect(result).toEqual({
            content: [{ type: 'text', text: 'Error: API Error' }],
            isError: true
        });
    });
});
