import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { queryTestTool } from '../../../src/tools/tests/query_test.js';
import { TestRailClient } from '../../../src/client/testrail.js';
import { Test } from '../../../src/tools/tests/types.js';
import fs from 'fs';

describe('query_test tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let getTestMock: jest.Mock<(testId: number) => Promise<Test>>;
    let getTestsMock: jest.Mock<(runId: number, statusId?: number[]) => Promise<Test[]>>;

    const mockSingleTest: Test = {
        id: 100,
        case_id: 501,
        status_id: 1,
        title: 'Verify Login Flow',
        run_id: 200,
        assignedto_id: 10,
        priority_id: 2,
        type_id: 1,
        refs: 'REQ-123',
        custom_notes: 'Automated test run',
    };

    const mockRunTests: Test[] = [
        {
            id: 100,
            case_id: 501,
            status_id: 1,
            title: 'Verify Login Flow',
            run_id: 200,
            assignedto_id: 10,
            priority_id: 2,
            refs: 'REQ-123',
        },
        {
            id: 101,
            case_id: 502,
            status_id: 5,
            title: 'Verify Logout Flow',
            run_id: 200,
            assignedto_id: 12,
            priority_id: 1,
            refs: null,
        },
    ];

    beforeEach(() => {
        getTestMock = jest.fn<(testId: number) => Promise<Test>>().mockResolvedValue(mockSingleTest);
        getTestsMock = jest.fn<(runId: number, statusId?: number[]) => Promise<Test[]>>().mockResolvedValue(mockRunTests);

        mockClient = {
            getTest: getTestMock,
            getTests: getTestsMock,
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(queryTestTool.name).toBe('query_test');
        expect(queryTestTool.mode).toBe('read');
        expect(queryTestTool.description).toBeDefined();
        expect(queryTestTool.parameters).toBeDefined();
    });

    describe('action: "one"', () => {
        test('fetches single test with numeric test_id', async () => {
            const result = await queryTestTool.handler(
                { payload: { action: 'one', test_id: 100 } },
                mockClient
            );

            expect(mockClient.getTest).toHaveBeenCalledWith(100);
            expect(result).toEqual({ test: mockSingleTest });
        });

        test('fetches single test with string test_id having T prefix', async () => {
            const result = await queryTestTool.handler(
                { payload: { action: 'one', test_id: 'T100' } },
                mockClient
            );

            expect(mockClient.getTest).toHaveBeenCalledWith(100);
            expect(result).toEqual({ test: mockSingleTest });
        });

        test('fetches single test with string test_id without prefix', async () => {
            const result = await queryTestTool.handler(
                { payload: { action: 'one', test_id: '100' } },
                mockClient
            );

            expect(mockClient.getTest).toHaveBeenCalledWith(100);
            expect(result).toEqual({ test: mockSingleTest });
        });

        test('throws error for invalid test ID', async () => {
            await expect(
                queryTestTool.handler(
                    { payload: { action: 'one', test_id: 'invalid-id' } },
                    mockClient
                )
            ).rejects.toThrow('Invalid entity ID: invalid-id');
        });

        test('propagates API client errors', async () => {
            getTestMock.mockRejectedValue(new Error('Test not found'));

            await expect(
                queryTestTool.handler(
                    { payload: { action: 'one', test_id: 999 } },
                    mockClient
                )
            ).rejects.toThrow('Test not found');
        });
    });

    describe('action: "many"', () => {
        test('fetches tests for a run returning compact default response', async () => {
            const result = await queryTestTool.handler(
                { payload: { action: 'many', run_id: 200 } },
                mockClient
            );

            expect(mockClient.getTests).toHaveBeenCalledWith(200, undefined);
            expect(result.tests).toHaveLength(2);
            expect(result.tests[0]).toEqual({
                id: 100,
                case_id: 501,
                status_id: 1,
                title: 'Verify Login Flow',
                run_id: 200,
            });
            expect(result.tests[1]).toEqual({
                id: 101,
                case_id: 502,
                status_id: 5,
                title: 'Verify Logout Flow',
                run_id: 200,
            });
        });

        test('passes status_id filter to client', async () => {
            await queryTestTool.handler(
                { payload: { action: 'many', run_id: 200, status_id: [1, 5] } },
                mockClient
            );

            expect(mockClient.getTests).toHaveBeenCalledWith(200, [1, 5]);
        });

        test('supports requesting additional fields (e.g. assignedto_id, priority_id, refs)', async () => {
            const result = await queryTestTool.handler(
                {
                    payload: {
                        action: 'many',
                        run_id: 200,
                        fields: ['assignedto_id', 'priority_id', 'refs'],
                    },
                },
                mockClient
            );

            expect(result.tests[0]).toEqual({
                id: 100,
                case_id: 501,
                status_id: 1,
                title: 'Verify Login Flow',
                run_id: 200,
                assignedto_id: 10,
                priority_id: 2,
                refs: 'REQ-123',
            });
        });

        test('saves tests response to output_file when specified', async () => {
            const writeFileSpy = jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);

            const result = await queryTestTool.handler(
                {
                    payload: {
                        action: 'many',
                        run_id: 200,
                        output_file: '/tmp/run_tests_export.json',
                    },
                },
                mockClient
            );

            expect(result).toEqual({
                success: true,
                message: 'Successfully exported 2 tests to /tmp/run_tests_export.json',
                file: '/tmp/run_tests_export.json',
            });
            expect(writeFileSpy).toHaveBeenCalledWith(
                '/tmp/run_tests_export.json',
                expect.stringContaining('"id":100'),
                'utf-8'
            );

            writeFileSpy.mockRestore();
        });

        test('propagates API client errors', async () => {
            getTestsMock.mockRejectedValue(new Error('Run not found'));

            await expect(
                queryTestTool.handler(
                    { payload: { action: 'many', run_id: 999 } },
                    mockClient
                )
            ).rejects.toThrow('Run not found');
        });
    });
});
