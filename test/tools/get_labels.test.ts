import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { getLabelsTool } from '../../src/tools/get_labels.js';
import { TestRailClient } from '../../src/client/testrail.js';
import { Label } from '../../src/types/testrail.js';

describe('get_labels tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let getLabelsMock: jest.Mock<(projectId: number) => Promise<Label[]>>;

    const mockLabels: Label[] = [
        { id: 1, title: 'backend' },
        { id: 2, title: 'frontend' },
        { id: 3, title: 'flaky' },
        { id: 4, title: 'regression' },
    ];

    beforeEach(() => {
        getLabelsMock = jest.fn<(projectId: number) => Promise<Label[]>>().mockResolvedValue(mockLabels);

        mockClient = {
            getLabels: getLabelsMock
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(getLabelsTool.name).toBe('get_labels');
        expect(getLabelsTool.description).toContain('labels');
        expect(getLabelsTool.parameters).toBeDefined();
    });

    test('handler fetches and returns labels for a project', async () => {
        const result = await getLabelsTool.handler({ project_id: 123 }, mockClient);

        expect(result).toBeDefined();
        expect(result.labels).toBeDefined();
        expect(result.labels).toHaveLength(4);
        expect(mockClient.getLabels).toHaveBeenCalledWith(123);
    });

    test('returns correct label structure', async () => {
        const result = await getLabelsTool.handler({ project_id: 123 }, mockClient);

        expect(result.labels[0]).toEqual({
            id: 1,
            title: 'backend',
        });
    });

    test('handler returns error on failure', async () => {
        getLabelsMock.mockRejectedValue(new Error('API Error'));

        await expect(getLabelsTool.handler({ project_id: 123 }, mockClient)).rejects.toThrow('API Error');
    });
});
