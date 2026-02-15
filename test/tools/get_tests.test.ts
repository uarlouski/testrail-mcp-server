import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { getTestsTool } from '../../src/tools/get_tests.js';
import { TestRailClient } from '../../src/client/testrail.js';
import { Test } from '../../src/types/testrail.js';

describe('get_tests tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let getTestsMock: jest.Mock<(runId: number, statusId?: number[]) => Promise<Test[]>>;

    const mockTests: Test[] = [
        { id: 1, case_id: 101, status_id: 1, title: 'Test 1', run_id: 1 },
        { id: 2, case_id: 102, status_id: 2, title: 'Test 2', run_id: 1 },
    ];

    beforeEach(() => {
        getTestsMock = jest.fn<(runId: number, statusId?: number[]) => Promise<Test[]>>().mockResolvedValue(mockTests);

        mockClient = {
            getTests: getTestsMock
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(getTestsTool.name).toBe('get_tests');
        expect(getTestsTool.description).toBeDefined();
        expect(getTestsTool.parameters).toBeDefined();
    });

    test('handler fetches and returns tests', async () => {
        const result = await getTestsTool.handler({ run_id: 1 }, mockClient);

        expect(result).toBeDefined();
        expect(result.statuses).toBeDefined();
        expect(result.statuses).toHaveLength(2);
        expect(mockClient.getTests).toHaveBeenCalledWith(1, undefined);
    });

    test('handler passes status_id filter', async () => {
        const result = await getTestsTool.handler({ run_id: 1, status_id: [1, 5] }, mockClient);
        expect(mockClient.getTests).toHaveBeenCalledWith(1, [1, 5]);
    });

    test('handler returns error on failure', async () => {
        getTestsMock.mockRejectedValue(new Error('API Error'));
        await expect(getTestsTool.handler({ run_id: 1 }, mockClient)).rejects.toThrow('API Error');
    });
});
