import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { getResultsTool } from '../../../src/tools/results/get_results.js';
import { TestRailClient } from '../../../src/client/testrail.js';
import { Result } from '../../../src/tools/results/types.js';

describe('get_results tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let getResultsMock: jest.Mock<(testId: number) => Promise<Result[]>>;

    const mockResults: Result[] = [
        {
            id: 100,
            test_id: 1,
            status_id: 1,
            comment: 'Verified successfully',
            defects: null
        }
    ];

    beforeEach(() => {
        getResultsMock = jest.fn<(testId: number) => Promise<Result[]>>()
            .mockResolvedValue(mockResults);

        mockClient = {
            getResults: getResultsMock
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(getResultsTool.name).toBe('get_results');
        expect(getResultsTool.description).toContain('results for a specific test');
        expect(getResultsTool.parameters).toBeDefined();
        expect(getResultsTool.parameters.test_id).toBeDefined();
    });

    test('handler fetches and returns test results', async () => {
        const result = await getResultsTool.handler({ test_id: 1 }, mockClient);

        expect(result).toBeDefined();
        expect(result.results).toHaveLength(1);
        expect(result.results[0].id).toBe(100);
        expect(mockClient.getResults).toHaveBeenCalledWith(1);
    });
});
