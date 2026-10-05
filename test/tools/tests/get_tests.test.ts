import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { getTestsTool } from '../../../src/tools/tests/get_tests.js';
import { TestRailClient } from '../../../src/client/testrail.js';
import { Test } from '../../../src/tools/tests/types.js';

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

    test('exports correct tool definition with deprecated: true', () => {
        expect(getTestsTool.name).toBe('get_tests');
        expect(getTestsTool.description).toBeDefined();
        expect(getTestsTool.parameters).toBeDefined();
        expect(getTestsTool.deprecated).toBe(true);
        expect(Object.keys(getTestsTool.parameters)).toEqual(['run_id', 'status_id']);
    });

    test('handler fetches and returns default compact tests', async () => {
        const result = await getTestsTool.handler({ run_id: 1 }, mockClient);

        expect(result).toBeDefined();
        expect(result.tests).toBeDefined();
        expect(result.tests).toHaveLength(2);
        expect(result.tests[0]).toEqual({
            id: 1,
            case_id: 101,
            status_id: 1,
            title: 'Test 1',
            run_id: 1,
        });
        expect(mockClient.getTests).toHaveBeenCalledWith(1, undefined);
    });

    test('handler passes status_id filter', async () => {
        await getTestsTool.handler({ run_id: 1, status_id: [1, 5] }, mockClient);
        expect(mockClient.getTests).toHaveBeenCalledWith(1, [1, 5]);
    });

    test('handler returns error on failure', async () => {
        getTestsMock.mockRejectedValue(new Error('API Error'));
        await expect(getTestsTool.handler({ run_id: 1 }, mockClient)).rejects.toThrow('API Error');
    });
});
