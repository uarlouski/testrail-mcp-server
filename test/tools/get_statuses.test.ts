import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { getStatusesTool } from '../../src/tools/get_statuses.js';
import { TestRailClient } from '../../src/client/testrail.js';
import { Status } from '../../src/types/testrail.js';

describe('get_statuses tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let getStatusesMock: jest.Mock<() => Promise<Status[]>>;

    const mockStatuses: Status[] = [
        { id: 1, name: 'passed', label: 'Passed' },
        { id: 2, name: 'blocked', label: 'Blocked' },
        { id: 3, name: 'untested', label: 'Untested' },
        { id: 4, name: 'retest', label: 'Retest' },
        { id: 5, name: 'failed', label: 'Failed' },
    ];

    beforeEach(() => {
        getStatusesMock = jest.fn<() => Promise<Status[]>>().mockResolvedValue(mockStatuses);

        mockClient = {
            getStatuses: getStatusesMock
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(getStatusesTool.name).toBe('get_statuses');
        expect(getStatusesTool.description).toContain('statuses');
        expect(getStatusesTool.parameters).toBeDefined();
    });

    test('handler fetches and returns statuses', async () => {
        const result = await getStatusesTool.handler({}, mockClient);

        expect(result).toBeDefined();
        expect(result.statuses).toBeDefined();
        expect(result.statuses).toHaveLength(5);
        expect(mockClient.getStatuses).toHaveBeenCalled();
    });

    test('returns correct status structure', async () => {
        const result = await getStatusesTool.handler({}, mockClient);

        expect(result.statuses[0]).toEqual({
            id: 1,
            name: 'passed',
            label: 'Passed'
        });
    });

    test('handler returns error on failure', async () => {
        getStatusesMock.mockRejectedValue(new Error('API Error'));

        await expect(getStatusesTool.handler({}, mockClient)).rejects.toThrow('API Error');
    });
});
