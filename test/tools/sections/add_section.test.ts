import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { addSectionTool } from '../../../src/tools/sections/add_section.js';
import { TestRailClient } from '../../../src/client/testrail.js';
import { Section } from '../../../src/types/testrail.js';

describe('add_section tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let addSectionMock: jest.Mock<(projectId: number, data: Record<string, any>) => Promise<Section>>;

    const mockSection: Section = {
        id: 42,
        name: 'New Feature Section',
        description: 'Testing section creation',
        parent_id: null,
        suite_id: 1,
    };

    beforeEach(() => {
        addSectionMock = jest.fn<(projectId: number, data: Record<string, any>) => Promise<Section>>()
            .mockResolvedValue(mockSection);

        mockClient = {
            addSection: addSectionMock,
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(addSectionTool.name).toBe('add_section');
        expect(addSectionTool.mode).toBe('create');
        expect(addSectionTool.description).toContain('section');
        expect(addSectionTool.parameters).toBeDefined();
        expect(addSectionTool.parameters.project_id).toBeDefined();
        expect(addSectionTool.parameters.name).toBeDefined();
        expect(addSectionTool.parameters.description).toBeDefined();
        expect(addSectionTool.parameters.parent_id).toBeDefined();
        // suite_id must NOT be defined as it was explicitly requested to be ignored
        expect((addSectionTool.parameters as any).suite_id).toBeUndefined();
    });

    test('handler creates and returns section successfully', async () => {
        const args = {
            project_id: 10,
            name: 'New Feature Section',
            description: 'Testing section creation',
        };

        const result = await addSectionTool.handler(args, mockClient);

        expect(result).toBeDefined();
        expect(result.id).toBe(42);
        expect(result.name).toBe('New Feature Section');
        expect(result.description).toBe('Testing section creation');
        expect(addSectionMock).toHaveBeenCalledWith(10, {
            name: 'New Feature Section',
            description: 'Testing section creation',
        });
    });

    test('handler handles parent_id parameter correctly', async () => {
        const args = {
            project_id: 10,
            name: 'Sub Section',
            parent_id: 5,
        };

        addSectionMock.mockResolvedValue({
            ...mockSection,
            name: 'Sub Section',
            parent_id: 5,
        });

        const result = await addSectionTool.handler(args, mockClient);

        expect(result.parent_id).toBe(5);
        expect(addSectionMock).toHaveBeenCalledWith(10, {
            name: 'Sub Section',
            parent_id: 5,
        });
    });

    test('handler throws error on API failure', async () => {
        addSectionMock.mockRejectedValue(new Error('TestRail API Down'));

        await expect(
            addSectionTool.handler({ project_id: 10, name: 'Fail Section' }, mockClient)
        ).rejects.toThrow('TestRail API Down');
    });
});
