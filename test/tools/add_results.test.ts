import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { addResultsTool } from '../../src/tools/add_results.js';
import { TestRailClient } from '../../src/client/testrail.js';
import { Result } from '../../src/types/testrail.js';

describe('add_results tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let addResultsMock: jest.Mock<(runId: number, results: Array<Record<string, any>>) => Promise<Result[]>>;

    const mockResults: Result[] = [
        {
            id: 1,
            test_id: 100,
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
        addResultsMock = jest.fn<(runId: number, results: Array<Record<string, any>>) => Promise<Result[]>>().mockResolvedValue(mockResults);

        mockClient = {
            addResults: addResultsMock
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(addResultsTool.name).toBe('add_results');
        expect(addResultsTool.description).toBeDefined();
        expect(addResultsTool.parameters).toBeDefined();
    });

    test('handler calls addResults with correct arguments', async () => {
        const args = {
            run_id: 50,
            results: [
                {
                    test_id: 100,
                    status_id: 1,
                    comment: 'Test passed'
                },
                {
                    test_id: 101,
                    status_id: 5,
                    comment: 'Test failed',
                    defects: 'BUG-123'
                }
            ]
        };

        const result = await addResultsTool.handler(args, mockClient);

        expect(result).toBeDefined();
        expect(mockClient.addResults).toHaveBeenCalledWith(50, args.results);

        expect(result.success).toBe(true);
        expect(result.added_count).toBe(2);
        expect(result.results).toHaveLength(2);
    });

    test('handler works with single result', async () => {
        const singleResult = [mockResults[0]];
        addResultsMock.mockResolvedValue(singleResult);

        const args = {
            run_id: 50,
            results: [
                {
                    test_id: 100,
                    status_id: 1,
                    comment: 'Test passed'
                }
            ]
        };

        const result = await addResultsTool.handler(args, mockClient);

        expect(result.success).toBe(true);
        expect(result.added_count).toBe(1);
    });

    test('handler returns error on failure', async () => {
        addResultsMock.mockRejectedValue(new Error('API Error'));
        await expect(addResultsTool.handler({ run_id: 50, results: [] }, mockClient)).rejects.toThrow('API Error');
    });
});
