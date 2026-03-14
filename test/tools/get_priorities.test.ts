import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { getPrioritiesTool } from '../../src/tools/get_priorities.js';
import { TestRailClient } from '../../src/client/testrail.js';
import { Priority } from '../../src/types/testrail.js';

describe('get_priorities tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let getPrioritiesMock: jest.Mock<() => Promise<Priority[]>>;

    const mockPriorities: Priority[] = [
        { id: 1, is_default: false, name: 'Critical' },
        { id: 2, is_default: false, name: 'High' },
        { id: 3, is_default: true,  name: 'Medium' },
        { id: 4, is_default: false, name: 'Low' },
    ];

    beforeEach(() => {
        getPrioritiesMock = jest.fn<() => Promise<Priority[]>>().mockResolvedValue(mockPriorities);

        mockClient = {
            getPriorities: getPrioritiesMock
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(getPrioritiesTool.name).toBe('get_priorities');
        expect(getPrioritiesTool.description).toContain('priorit');
        expect(getPrioritiesTool.parameters).toBeDefined();
    });

    test('handler fetches and returns priorities', async () => {
        const result = await getPrioritiesTool.handler({}, mockClient);

        expect(result).toBeDefined();
        expect(result.priorities).toBeDefined();
        expect(result.priorities).toHaveLength(4);
        expect(mockClient.getPriorities).toHaveBeenCalled();
    });

    test('returns correct priority structure', async () => {
        const result = await getPrioritiesTool.handler({}, mockClient);

        expect(result.priorities[0]).toEqual({
            id: 1,
            is_default: false,
            name: 'Critical',
        });
    });

    test('correctly reflects default priority flag', async () => {
        const result = await getPrioritiesTool.handler({}, mockClient);

        const defaultPriority = result.priorities.find((p: Priority) => p.is_default);
        expect(defaultPriority).toBeDefined();
        expect(defaultPriority?.name).toBe('Medium');
    });

    test('handler returns error on failure', async () => {
        getPrioritiesMock.mockRejectedValue(new Error('API Error'));

        await expect(getPrioritiesTool.handler({}, mockClient)).rejects.toThrow('API Error');
    });
});
