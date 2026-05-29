import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { mutateSectionTool } from '../../../src/tools/sections/mutate_section.js';
import { TestRailClient } from '../../../src/client/testrail.js';
import { Section } from '../../../src/tools/sections/types.js';

describe('mutate_section tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let addSectionMock: jest.Mock<(projectId: number, data: Record<string, any>) => Promise<Section>>;
    let updateSectionMock: jest.Mock<(sectionId: number, data: Record<string, any>) => Promise<Section>>;

    const mockSection: Section = {
        id: 42,
        name: 'New Feature Section',
        description: 'Testing section mutation',
        parent_id: null,
        suite_id: 1,
    };

    beforeEach(() => {
        addSectionMock = jest.fn<(projectId: number, data: Record<string, any>) => Promise<Section>>()
            .mockResolvedValue(mockSection);
        
        updateSectionMock = jest.fn<(sectionId: number, data: Record<string, any>) => Promise<Section>>()
            .mockResolvedValue(mockSection);

        mockClient = {
            addSection: addSectionMock,
            updateSection: updateSectionMock,
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(mutateSectionTool.name).toBe('mutate_section');
        expect(mutateSectionTool.mode).toBe('write');
        expect(mutateSectionTool.description).toContain('section');
        expect(mutateSectionTool.parameters).toBeDefined();
        expect(mutateSectionTool.parameters.payload).toBeDefined();
    });

    test('handler creates section successfully (action: create)', async () => {
        const args = {
            payload: {
                action: 'create' as const,
                project_id: 10,
                name: 'New Feature Section',
                description: 'Testing section creation',
            }
        };

        const result = await mutateSectionTool.handler(args, mockClient);

        expect(result).toBeDefined();
        expect(result.id).toBe(42);
        expect(result.name).toBe('New Feature Section');
        expect(addSectionMock).toHaveBeenCalledWith(10, {
            name: 'New Feature Section',
            description: 'Testing section creation',
        });
        expect(updateSectionMock).not.toHaveBeenCalled();
    });

    test('handler updates section successfully (action: update)', async () => {
        const args = {
            payload: {
                action: 'update' as const,
                section_id: 42,
                name: 'Updated Section Name',
            }
        };

        updateSectionMock.mockResolvedValue({
            ...mockSection,
            name: 'Updated Section Name',
        });

        const result = await mutateSectionTool.handler(args, mockClient);

        expect(result).toBeDefined();
        expect(result.id).toBe(42);
        expect(result.name).toBe('Updated Section Name');
        expect(updateSectionMock).toHaveBeenCalledWith(42, {
            name: 'Updated Section Name',
        });
        expect(addSectionMock).not.toHaveBeenCalled();
    });

    test('handler throws error on API failure', async () => {
        addSectionMock.mockRejectedValue(new Error('TestRail API Down'));

        await expect(
            mutateSectionTool.handler({
                payload: {
                    action: 'create',
                    project_id: 10,
                    name: 'Fail Section'
                }
            }, mockClient)
        ).rejects.toThrow('TestRail API Down');
    });

    test('handler throws error on unsupported action', async () => {
        await expect(
            mutateSectionTool.handler({
                payload: {
                    action: 'delete' as any,
                }
            }, mockClient)
        ).rejects.toThrow('Unsupported mutation action: delete');
    });
});
