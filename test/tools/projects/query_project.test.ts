import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { queryProjectTool } from '../../../src/tools/projects/query_project.js';
import { TestRailClient } from '../../../src/client/testrail.js';
import { Project } from '../../../src/tools/projects/types.js';

describe('query_project tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let getProjectMock: jest.Mock<(projectId: number) => Promise<Project>>;
    let getProjectsMock: jest.Mock<() => Promise<Project[]>>;

    const mockActiveProject: Project = { id: 1, name: 'Project Alpha', is_completed: false, suite_mode: 1 };
    const mockCompletedProject: Project = { id: 2, name: 'Project Beta', is_completed: true, suite_mode: 1 };
    const mockProjects: Project[] = [mockActiveProject, mockCompletedProject];

    beforeEach(() => {
        getProjectMock = jest.fn<(projectId: number) => Promise<Project>>()
            .mockResolvedValue(mockActiveProject);
        getProjectsMock = jest.fn<() => Promise<Project[]>>()
            .mockResolvedValue(mockProjects);

        mockClient = {
            getProject: getProjectMock,
            getProjects: getProjectsMock
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(queryProjectTool.name).toBe('query_project');
        expect(queryProjectTool.description).toContain('Retrieve a single project or all projects');
        expect(queryProjectTool.parameters).toBeDefined();
        expect(queryProjectTool.parameters.payload).toBeDefined();
    });

    test('handler fetches and returns a specific project when action is "one"', async () => {
        const result = await queryProjectTool.handler({
            payload: {
                action: "one",
                project_id: 1
            }
        }, mockClient);

        expect(result).toBeDefined();
        expect(result.project).toBeDefined();
        expect(result.project.id).toBe(1);
        expect(mockClient.getProject).toHaveBeenCalledWith(1);
        expect(mockClient.getProjects).not.toHaveBeenCalled();
    });

    test('handler fetches and returns only active projects by default when action is "many"', async () => {
        const result = await queryProjectTool.handler({
            payload: {
                action: "many"
            }
        }, mockClient);

        expect(result).toBeDefined();
        expect(result.projects).toHaveLength(1);
        expect(result.projects[0].id).toBe(1);
        expect(result.projects[0].name).toBe('Project Alpha');
        expect(mockClient.getProjects).toHaveBeenCalled();
    });
});
