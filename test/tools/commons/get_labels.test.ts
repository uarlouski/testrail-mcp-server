import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { getLabelsTool } from '../../../src/tools/commons/get_labels.js';
import { TestRailClient } from '../../../src/client/testrail.js';
import { Label } from '../../../src/tools/commons/types.js';

describe('get_labels tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let getLabelsMock: jest.Mock<(projectId: number) => Promise<Label[]>>;

    const mockLabels: Label[] = [
        { id: 1, name: 'backend' },
        { id: 2, name: 'frontend' },
        { id: 3, name: 'flaky' },
        { id: 4, name: 'regression' },
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
            name: 'backend',
        });
    });

    test('parses the real API shape and strips extra fields', async () => {
        getLabelsMock.mockResolvedValue([
            { id: 3, name: 'manual_only', created_by: 13, created_on: 1772801578 },
        ] as unknown as Label[]);

        const result = await getLabelsTool.handler({ project_id: 123 }, mockClient);

        expect(result.labels).toEqual([{ id: 3, name: 'manual_only' }]);
    });

    test('throws when a label has no name', async () => {
        getLabelsMock.mockResolvedValue([{ id: 3, title: 'oops' }] as unknown as Label[]);

        await expect(getLabelsTool.handler({ project_id: 123 }, mockClient)).rejects.toThrow();
    });

    test('handler returns error on failure', async () => {
        getLabelsMock.mockRejectedValue(new Error('API Error'));

        await expect(getLabelsTool.handler({ project_id: 123 }, mockClient)).rejects.toThrow('API Error');
    });
});
