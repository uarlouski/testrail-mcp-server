import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { queryRunTool } from '../../../src/tools/runs/query_run.js';
import { TestRailClient } from '../../../src/client/testrail.js';
import { Run } from '../../../src/tools/runs/types.js';

describe('query_run tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let getRunMock: jest.Mock<(runId: number) => Promise<Run>>;
    let getRunsMock: jest.Mock<(projectId: number, filter?: Record<string, string>) => Promise<Run[]>>;

    const mockRun: Run = {
        id: 10,
        name: 'Run 1',
        description: 'Desc 1',
        suite_id: 1,
        project_id: 1,
        is_completed: false,
        passed_count: 5,
        blocked_count: 0,
        untested_count: 10,
        retest_count: 0,
        failed_count: 2,
        url: 'http://url/10'
    };
    const mockRuns: Run[] = [mockRun];

    beforeEach(() => {
        getRunMock = jest.fn<(runId: number) => Promise<Run>>()
            .mockResolvedValue(mockRun);
        getRunsMock = jest.fn<(projectId: number, filter?: Record<string, string>) => Promise<Run[]>>()
            .mockResolvedValue(mockRuns);

        mockClient = {
            getRun: getRunMock,
            getRuns: getRunsMock
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(queryRunTool.name).toBe('query_run');
        expect(queryRunTool.description).toContain('Retrieve a single test run or all test runs');
        expect(queryRunTool.parameters).toBeDefined();
        expect(queryRunTool.parameters.payload).toBeDefined();
    });

    test('handler fetches and returns a single run when action is "one"', async () => {
        const result = await queryRunTool.handler({
            payload: {
                action: "one",
                run_id: 10
            }
        }, mockClient);

        expect(result).toBeDefined();
        expect(result.run).toBeDefined();
        expect(result.run.id).toBe(10);
        expect(mockClient.getRun).toHaveBeenCalledWith(10);
        expect(mockClient.getRuns).not.toHaveBeenCalled();
    });

    test('handler fetches and returns test runs without filters when action is "many"', async () => {
        const result = await queryRunTool.handler({
            payload: {
                action: "many",
                project_id: 1
            }
        }, mockClient);

        expect(result).toBeDefined();
        expect(result.runs).toHaveLength(1);
        expect(result.runs[0].id).toBe(10);
        expect(mockClient.getRuns).toHaveBeenCalledWith(1, {});
        expect(mockClient.getRun).not.toHaveBeenCalled();
    });

    test('handler passes filters to the client when action is "many"', async () => {
        await queryRunTool.handler({
            payload: {
                action: "many",
                project_id: 1,
                suite_id: 2,
                is_completed: 1
            }
        }, mockClient);

        expect(mockClient.getRuns).toHaveBeenCalledWith(1, {
            suite_id: '2',
            is_completed: '1'
        });
    });

    test('handler ignores null or undefined filter values when action is "many"', async () => {
        await queryRunTool.handler({
            payload: {
                action: "many",
                project_id: 1,
                suite_id: null as any,
                is_completed: undefined
            }
        }, mockClient);

        expect(mockClient.getRuns).toHaveBeenCalledWith(1, {});
    });
});
