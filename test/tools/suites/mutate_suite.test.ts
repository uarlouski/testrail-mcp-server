import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { mutateSuiteTool } from '../../../src/tools/suites/mutate_suite.js';
import { TestRailClient } from '../../../src/client/testrail.js';
import { Suite } from '../../../src/tools/suites/types.js';

describe('mutate_suite tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let addSuiteMock: jest.Mock<(projectId: number, data: Record<string, any>) => Promise<Suite>>;
    let updateSuiteMock: jest.Mock<(suiteId: number, data: Record<string, any>) => Promise<Suite>>;

    const mockSuite: Suite = {
        id: 101,
        name: 'New Test Suite',
        description: 'Testing suite mutation',
        project_id: 1,
        url: 'https://testrail.example.com/index.php?/suites/view/101',
    };

    beforeEach(() => {
        addSuiteMock = jest.fn<(projectId: number, data: Record<string, any>) => Promise<Suite>>()
            .mockResolvedValue(mockSuite);
        
        updateSuiteMock = jest.fn<(suiteId: number, data: Record<string, any>) => Promise<Suite>>()
            .mockResolvedValue(mockSuite);

        mockClient = {
            addSuite: addSuiteMock,
            updateSuite: updateSuiteMock,
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(mutateSuiteTool.name).toBe('mutate_suite');
        expect(mutateSuiteTool.mode).toBe('write');
        expect(mutateSuiteTool.description).toContain('suite');
        expect(mutateSuiteTool.parameters).toBeDefined();
        expect(mutateSuiteTool.parameters.payload).toBeDefined();
    });

    test('handler creates suite successfully (action: create)', async () => {
        const args = {
            payload: {
                action: 'create' as const,
                project_id: 1,
                name: 'New Test Suite',
                description: 'Testing suite creation',
            }
        };

        const result = await mutateSuiteTool.handler(args, mockClient);

        expect(result).toBeDefined();
        expect(result.id).toBe(101);
        expect(result.name).toBe('New Test Suite');
        expect(addSuiteMock).toHaveBeenCalledWith(1, {
            name: 'New Test Suite',
            description: 'Testing suite creation',
        });
        expect(updateSuiteMock).not.toHaveBeenCalled();
    });

    test('handler updates suite successfully (action: update)', async () => {
        const args = {
            payload: {
                action: 'update' as const,
                suite_id: 101,
                name: 'Updated Suite Name',
            }
        };

        updateSuiteMock.mockResolvedValue({
            ...mockSuite,
            name: 'Updated Suite Name',
        });

        const result = await mutateSuiteTool.handler(args, mockClient);

        expect(result).toBeDefined();
        expect(result.id).toBe(101);
        expect(result.name).toBe('Updated Suite Name');
        expect(updateSuiteMock).toHaveBeenCalledWith(101, {
            name: 'Updated Suite Name',
        });
        expect(addSuiteMock).not.toHaveBeenCalled();
    });

    test('handler throws error on API failure', async () => {
        addSuiteMock.mockRejectedValue(new Error('TestRail API Down'));

        await expect(
            mutateSuiteTool.handler({
                payload: {
                    action: 'create',
                    project_id: 1,
                    name: 'Fail Suite'
                }
            }, mockClient)
        ).rejects.toThrow('TestRail API Down');
    });

    test('handler throws error on unsupported action', async () => {
        await expect(
            mutateSuiteTool.handler({
                payload: {
                    action: 'delete' as any,
                }
            }, mockClient)
        ).rejects.toThrow('Unsupported mutation action: delete');
    });
});
