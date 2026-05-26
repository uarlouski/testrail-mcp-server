import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { mutateRunTool } from '../../../src/tools/runs/mutate_run.js';
import { TestRailClient } from '../../../src/client/testrail.js';
import { Run, Case } from '../../../src/types/testrail.js';

describe('mutate_run tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let addRunMock: jest.Mock<(projectId: number, data: Record<string, any>) => Promise<Run>>;
    let updateRunMock: jest.Mock<(runId: number, data: Record<string, any>) => Promise<Run>>;
    let getCaseMock: jest.Mock<(caseId: number) => Promise<Case>>;

    const mockRun: Run = {
        id: 42,
        name: 'New Test Run',
        description: 'Testing run mutation',
        suite_id: 1,
        project_id: 10,
        is_completed: false,
        passed_count: 0,
        blocked_count: 0,
        untested_count: 10,
        retest_count: 0,
        failed_count: 0,
        url: 'https://testrail.com/run/42'
    };

    const mockCase: Case = {
        id: 101,
        title: 'Sample Case',
        section_id: 2,
        template_id: 1,
        type_id: 1,
        priority_id: 1,
        milestone_id: null,
        refs: null,
        created_on: 12345,
        updated_on: 12345,
        estimate: null,
        suite_id: 1,
        labels: [],
    };

    beforeEach(() => {
        addRunMock = jest.fn<(projectId: number, data: Record<string, any>) => Promise<Run>>()
            .mockResolvedValue(mockRun);
        
        updateRunMock = jest.fn<(runId: number, data: Record<string, any>) => Promise<Run>>()
            .mockResolvedValue(mockRun);

        getCaseMock = jest.fn<(caseId: number) => Promise<Case>>()
            .mockResolvedValue(mockCase);

        mockClient = {
            addRun: addRunMock,
            updateRun: updateRunMock,
            getCase: getCaseMock,
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(mutateRunTool.name).toBe('mutate_run');
        expect(mutateRunTool.mode).toBe('write');
        expect(mutateRunTool.description).toContain('test run');
        expect(mutateRunTool.parameters).toBeDefined();
        expect(mutateRunTool.parameters.payload).toBeDefined();
    });

    test('handler creates run successfully (action: create) with auto-determined suite_id', async () => {
        const args = {
            payload: {
                action: 'create' as const,
                project_id: 10,
                name: 'New Test Run',
                description: 'Testing run creation',
                case_ids: [101, 102],
            }
        };

        const result = await mutateRunTool.handler(args, mockClient);

        expect(result).toBeDefined();
        expect(result.id).toBe(42);
        expect(result.name).toBe('New Test Run');
        
        expect(getCaseMock).toHaveBeenCalledWith(101);
        expect(addRunMock).toHaveBeenCalledWith(10, {
            name: 'New Test Run',
            description: 'Testing run creation',
            suite_id: 1, // Determined from getCaseMock response
            include_all: false,
            case_ids: [101, 102],
        });
        expect(updateRunMock).not.toHaveBeenCalled();
    });

    test('handler updates run successfully (action: update)', async () => {
        const args = {
            payload: {
                action: 'update' as const,
                run_id: 42,
                name: 'Updated Run Name',
            }
        };

        updateRunMock.mockResolvedValue({
            ...mockRun,
            name: 'Updated Run Name',
        });

        const result = await mutateRunTool.handler(args, mockClient);

        expect(result).toBeDefined();
        expect(result.id).toBe(42);
        expect(result.name).toBe('Updated Run Name');
        expect(updateRunMock).toHaveBeenCalledWith(42, {
            name: 'Updated Run Name',
        });
        expect(addRunMock).not.toHaveBeenCalled();
        expect(getCaseMock).not.toHaveBeenCalled();
    });

    test('handler throws error on API failure', async () => {
        addRunMock.mockRejectedValue(new Error('TestRail API Down'));

        await expect(
            mutateRunTool.handler({
                payload: {
                    action: 'create',
                    project_id: 10,
                    name: 'Fail Run',
                    case_ids: [101],
                }
            }, mockClient)
        ).rejects.toThrow('TestRail API Down');
    });

    test('handler throws error on unsupported action', async () => {
        await expect(
            mutateRunTool.handler({
                payload: {
                    action: 'delete' as any,
                }
            }, mockClient)
        ).rejects.toThrow('Unsupported mutation action: delete');
    });
});
