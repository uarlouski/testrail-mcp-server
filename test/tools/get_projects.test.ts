import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { getProjectsTool } from '../../src/tools/get_projects.js';
import { TestRailClient } from '../../src/client/testrail.js';
import { Project } from '../../src/types/testrail.js';

describe('get_projects tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let getProjectsMock: jest.Mock<() => Promise<Project[]>>;

    const mockProjects: Project[] = [
        { id: 1, name: 'Project Alpha', is_completed: false, suite_mode: 1 },
        { id: 2, name: 'Project Beta', is_completed: false, suite_mode: 3 },
        { id: 3, name: 'Old Project', is_completed: true, suite_mode: 1 },
    ];

    beforeEach(() => {
        getProjectsMock = jest.fn<() => Promise<Project[]>>()
            .mockResolvedValue(mockProjects);

        mockClient = {
            getProjects: getProjectsMock
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(getProjectsTool.name).toBe('get_projects');
        expect(getProjectsTool.description).toContain('project');
        expect(getProjectsTool.parameters).toBeDefined();
    });

    test('handler fetches and returns projects', async () => {
        const result = await getProjectsTool.handler({}, mockClient);

        expect(result).toBeDefined();
        expect(result.projects).toHaveLength(2);
        expect(mockClient.getProjects).toHaveBeenCalled();
    });
});
