import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { updateCasesTool } from '../../src/tools/update_cases.js';
import { TestRailClient } from '../../src/client/testrail.js';
import { Case } from '../../src/types/testrail.js';

describe('update_cases tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let updateCasesMock: jest.Mock<(caseIds: number[], fields: Record<string, any>) => Promise<Case[]>>;

    const mockUpdatedCases: Case[] = [
        {
            id: 1, title: 'Test Case 1', section_id: 1, template_id: 1, type_id: 1,
            priority_id: 3, milestone_id: null, refs: null, created_on: 1700000000,
            updated_by: 1, updated_on: 1700000001, estimate: null,
            suite_id: 1, labels: []
        },
        {
            id: 2, title: 'Test Case 2', section_id: 1, template_id: 1, type_id: 1,
            priority_id: 3, milestone_id: null, refs: null, created_on: 1700000000,
            updated_by: 1, updated_on: 1700000001, estimate: null,
            suite_id: 1, labels: []
        },
        {
            id: 3, title: 'Test Case 3', section_id: 1, template_id: 1, type_id: 1,
            priority_id: 3, milestone_id: null, refs: null, created_on: 1700000000,
            updated_by: 1, updated_on: 1700000001, estimate: null,
            suite_id: 1, labels: []
        },
    ];

    beforeEach(() => {
        updateCasesMock = jest.fn<(caseIds: number[], fields: Record<string, any>) => Promise<Case[]>>()
            .mockResolvedValue(mockUpdatedCases);

        mockClient = {
            updateCases: updateCasesMock,
            getCase: jest.fn(),
        } as unknown as jest.Mocked<TestRailClient>;

        // Default mock for getCase to avoid failures in unrelated tests
        (mockClient.getCase as jest.Mock<any>).mockResolvedValue({ suite_id: 1 });
    });

    test('exports correct tool definition', () => {
        expect(updateCasesTool.name).toBe('update_cases');
        expect(updateCasesTool.description).toContain('Bulk');
        expect(updateCasesTool.parameters).toBeDefined();
        expect(updateCasesTool.parameters.case_ids).toBeDefined();
        expect(updateCasesTool.parameters.fields).toBeDefined();
    });

    test('handler updates cases and returns success response', async () => {
        const result = await updateCasesTool.handler(
            { case_ids: [1, 2, 3], fields: { priority_id: 3 } },
            mockClient
        );

        expect(result).toBeDefined();
        expect(result.success).toBe(true);
        expect(result.updated_count).toBe(3);
        expect(result.case_ids).toEqual([1, 2, 3]);
        expect(result.message).toContain('3 test cases');
    });

    test('passes case_ids and fields correctly', async () => {
        const fields = { priority_id: 2, type_id: 1 };
        const mockCase = { suite_id: 5 } as Case;
        (mockClient.getCase as jest.Mock<any>).mockResolvedValue(mockCase);

        await updateCasesTool.handler(
            { case_ids: [10, 20, 30], fields },
            mockClient
        );
        expect(mockClient.getCase).toHaveBeenCalledWith(10);
        expect(mockClient.updateCases).toHaveBeenCalledWith(5, [10, 20, 30], fields);
    });

    test('handler throws error on failure', async () => {
        updateCasesMock.mockRejectedValue(new Error('API Error'));

        await expect(
            updateCasesTool.handler(
                { case_ids: [1, 2], fields: { priority_id: 2 } },
                mockClient
            )
        ).rejects.toThrow('API Error');
    });
});
