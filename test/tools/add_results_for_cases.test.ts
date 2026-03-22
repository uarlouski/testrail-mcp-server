import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { addResultsForCasesTool } from '../../src/tools/add_results_for_cases.js';
import { TestRailClient } from '../../src/client/testrail.js';
import { Result } from '../../src/types/testrail.js';

describe('add_results_for_cases tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let addResultsForCasesMock: jest.Mock<(runId: number, results: Array<Record<string, any>>) => Promise<Result[]>>;

    const mockResults: Result[] = [
        {
            id: 1,
            test_id: 100, // API still returns the test_id in the result
            status_id: 1,
            comment: 'Test passed',
            defects: null
        },
        {
            id: 2,
            test_id: 101,
            status_id: 5,
            comment: 'Test failed',
            defects: 'BUG-123'
        }
    ];

    beforeEach(() => {
        addResultsForCasesMock = jest.fn<(runId: number, results: Array<Record<string, any>>) => Promise<Result[]>>().mockResolvedValue(mockResults);

        mockClient = {
            addResultsForCases: addResultsForCasesMock
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(addResultsForCasesTool.name).toBe('add_results_for_cases');
        expect(addResultsForCasesTool.description).toBeDefined();
        expect(addResultsForCasesTool.parameters).toBeDefined();
    });

    test('handler calls addResultsForCases with correct arguments', async () => {
        const args = {
            run_id: 50,
            results: [
                {
                    case_id: 1000,
                    status_id: 1,
                    comment: 'Test passed'
                },
                {
                    case_id: 1001,
                    status_id: 5,
                    comment: 'Test failed',
                    defects: 'BUG-123'
                }
            ]
        };

        const result = await addResultsForCasesTool.handler(args, mockClient);

        expect(result).toBeDefined();
        expect(mockClient.addResultsForCases).toHaveBeenCalledWith(50, args.results);

        expect(result.success).toBe(true);
        expect(result.added_count).toBe(2);
        expect(result.results).toHaveLength(2);
    });

    test('handler works with single result', async () => {
        const singleResult = [mockResults[0]];
        addResultsForCasesMock.mockResolvedValue(singleResult);

        const args = {
            run_id: 50,
            results: [
                {
                    case_id: 1000,
                    status_id: 1,
                    comment: 'Test passed'
                }
            ]
        };

        const result = await addResultsForCasesTool.handler(args, mockClient);

        expect(result.success).toBe(true);
        expect(result.added_count).toBe(1);
    });

    test('handler returns error on failure', async () => {
        addResultsForCasesMock.mockRejectedValue(new Error('API Error'));
        await expect(addResultsForCasesTool.handler({ run_id: 50, results: [] }, mockClient)).rejects.toThrow('API Error');
    });
});
