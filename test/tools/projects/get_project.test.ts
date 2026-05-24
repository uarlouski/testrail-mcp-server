import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { getProjectTool } from '../../../src/tools/projects/get_project.js';
import { TestRailClient } from '../../../src/client/testrail.js';
import { Project } from '../../../src/types/testrail.js';

describe('get_project tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let getProjectMock: jest.Mock<(projectId: number) => Promise<Project>>;

    const mockProject: Project = { id: 1, name: 'Project Alpha', is_completed: false, suite_mode: 1 };

    beforeEach(() => {
        getProjectMock = jest.fn<(projectId: number) => Promise<Project>>()
            .mockResolvedValue(mockProject);

        mockClient = {
            getProject: getProjectMock
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(getProjectTool.name).toBe('get_project');
        expect(getProjectTool.description).toContain('specific project');
        expect(getProjectTool.parameters).toBeDefined();
        expect(getProjectTool.parameters.project_id).toBeDefined();
    });

    test('handler fetches and returns a specific project', async () => {
        const result = await getProjectTool.handler({ project_id: 1 }, mockClient);

        expect(result).toBeDefined();
        expect(result.project.id).toBe(1);
        expect(result.project.name).toBe('Project Alpha');
        expect(mockClient.getProject).toHaveBeenCalledWith(1);
    });
});
