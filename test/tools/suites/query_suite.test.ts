import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { querySuiteTool } from '../../../src/tools/suites/query_suite.js';
import { TestRailClient } from '../../../src/client/testrail.js';
import { Suite } from '../../../src/tools/suites/types.js';

describe('query_suite tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let getSuiteMock: jest.Mock<(suiteId: number) => Promise<Suite>>;
    let getSuitesMock: jest.Mock<(projectId: number) => Promise<Suite[]>>;

    const mockSuite: Suite = { id: 1, name: 'Suite 1', description: 'Desc 1', project_id: 1, url: 'http://url/1' };
    const mockSuites: Suite[] = [
        mockSuite,
        { id: 2, name: 'Suite 2', description: 'Desc 2', project_id: 1, url: 'http://url/2' }
    ];

    beforeEach(() => {
        getSuiteMock = jest.fn<(suiteId: number) => Promise<Suite>>()
            .mockResolvedValue(mockSuite);
        getSuitesMock = jest.fn<(projectId: number) => Promise<Suite[]>>()
            .mockResolvedValue(mockSuites);

        mockClient = {
            getSuite: getSuiteMock,
            getSuites: getSuitesMock
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(querySuiteTool.name).toBe('query_suite');
        expect(querySuiteTool.description).toContain('Retrieve a single test suite or all test suites');
        expect(querySuiteTool.parameters).toBeDefined();
        expect(querySuiteTool.parameters.payload).toBeDefined();
    });

    test('handler fetches and returns a single suite when action is "one"', async () => {
        const result = await querySuiteTool.handler({
            payload: {
                action: "one",
                suite_id: 1
            }
        }, mockClient);

        expect(result).toBeDefined();
        expect(result.suite).toBeDefined();
        expect(result.suite.id).toBe(1);
        expect(mockClient.getSuite).toHaveBeenCalledWith(1);
        expect(mockClient.getSuites).not.toHaveBeenCalled();
    });

    test('handler fetches and returns all suites under project when action is "many"', async () => {
        const result = await querySuiteTool.handler({
            payload: {
                action: "many",
                project_id: 5
            }
        }, mockClient);

        expect(result).toBeDefined();
        expect(result.suites).toHaveLength(2);
        expect(result.suites[0].id).toBe(1);
        expect(result.suites[1].id).toBe(2);
        expect(mockClient.getSuites).toHaveBeenCalledWith(5);
        expect(mockClient.getSuite).not.toHaveBeenCalled();
    });
});
