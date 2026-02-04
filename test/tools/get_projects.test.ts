import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { getProjectsTool } from '../../src/tools/get_projects.js';
import { TestRailClient } from '../../src/client/testrail.js';
import { Project } from '../../src/types/testrail.js';

describe('get_projects tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let getProjectsMock: jest.Mock<() => Promise<Project[]>>;

    const mockProjects: Project[] = [
        { id: 1, name: 'Project Alpha', announcement: null, is_completed: false, suite_mode: 1 },
        { id: 2, name: 'Project Beta', announcement: 'Active project', is_completed: false, suite_mode: 3 },
        { id: 3, name: 'Old Project', announcement: null, is_completed: true, suite_mode: 1 },
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
        expect(result.content[0].type).toBe('text');

        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.projects).toHaveLength(2); // Only active projects
        expect(mockClient.getProjects).toHaveBeenCalled();
    });

    test('filters out completed projects', async () => {
        const result = await getProjectsTool.handler({}, mockClient);
        const parsed = JSON.parse(result.content[0].text);

        const completedProject = parsed.projects.find((p: any) => p.name === 'Old Project');
        expect(completedProject).toBeUndefined();
    });

    test('returns correct project structure', async () => {
        const result = await getProjectsTool.handler({}, mockClient);
        const parsed = JSON.parse(result.content[0].text);

        expect(parsed.projects[0]).toEqual({
            id: 1,
            name: 'Project Alpha',
        });

        expect(parsed.projects[1]).toEqual({
            id: 2,
            name: 'Project Beta',
        });
    });

    test('handler returns error on failure', async () => {
        getProjectsMock.mockRejectedValue(new Error('API Error'));

        const result = await getProjectsTool.handler({}, mockClient);

        expect(result).toEqual({
            content: [{ type: 'text', text: 'Error: API Error' }],
            isError: true
        });
    });
});
