import { jest } from '@jest/globals';
import { addRunTool } from '../../src/tools/add_run.js';
import { TestRailClient } from '../../src/client/testrail.js';

describe('add_run tool', () => {
    let client: TestRailClient;
    let addRunMock: any;

    beforeEach(() => {
        addRunMock = jest.fn();
        client = {
            addRun: addRunMock,
            getCase: jest.fn(),
        } as any as TestRailClient;
    });

    test('should wrap client result including only required fields and forcing include_all to false', async () => {
        const run = {
            id: 1,
            name: 'Test Run',
            description: null,
            suite_id: 10,
            project_id: 1,
            is_completed: false,
            passed_count: 0,
            blocked_count: 0,
            untested_count: 5,
            retest_count: 0,
            failed_count: 0,
            url: 'https://testrail.io/runs/view/1'
        };
        addRunMock.mockResolvedValue(run);

        const mockCase = { suite_id: 10 };
        (client.getCase as jest.Mock<any>).mockResolvedValue(mockCase);

        const result = await addRunTool.handler({ project_id: 1, name: 'Test Run', case_ids: [1] }, client);
        expect(client.getCase).toHaveBeenCalledWith(1);
        expect(addRunMock).toHaveBeenCalledWith(1, { name: 'Test Run', case_ids: [1], suite_id: 10, include_all: false });
        expect(result).toEqual(run);
    });

    test('should wrap client result handling optional fields', async () => {
        const run = {
            id: 1,
            name: 'Test Run',
            description: 'Description',
            suite_id: 10,
            project_id: 1,
            is_completed: false,
            passed_count: 0,
            blocked_count: 0,
            untested_count: 3,
            retest_count: 0,
            failed_count: 0,
            url: 'https://testrail.io/runs/view/1'
        };
        addRunMock.mockResolvedValue(run);

        const mockCase = { suite_id: 10 };
        (client.getCase as jest.Mock<any>).mockResolvedValue(mockCase);

        const args = {
            project_id: 1,
            name: 'Test Run',
            description: 'Description',
            case_ids: [1, 2, 3]
        };

        const result = await addRunTool.handler(args, client);
        expect(client.getCase).toHaveBeenCalledWith(1);
        expect(addRunMock).toHaveBeenCalledWith(1, {
            name: 'Test Run',
            description: 'Description',
            case_ids: [1, 2, 3],
            suite_id: 10,
            include_all: false
        });
        expect(result).toEqual(run);
    });
});
