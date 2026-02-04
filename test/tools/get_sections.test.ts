import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { getSectionsTool } from '../../src/tools/get_sections.js';
import { TestRailClient } from '../../src/client/testrail.js';
import { Section } from '../../src/types/testrail.js';

describe('get_sections tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let getSectionsMock: jest.Mock<(projectId: string) => Promise<Section[]>>;

    const mockSections: Section[] = [
        { id: 1, name: 'Login', description: null, parent_id: null, depth: 0, display_order: 1, suite_id: 1 },
        { id: 2, name: 'Authentication', description: 'Auth tests', parent_id: 1, depth: 1, display_order: 2, suite_id: 1 },
        { id: 3, name: 'Registration', description: null, parent_id: null, depth: 0, display_order: 3, suite_id: 1 },
    ];

    beforeEach(() => {
        getSectionsMock = jest.fn<(projectId: string) => Promise<Section[]>>()
            .mockResolvedValue(mockSections);

        mockClient = {
            getSections: getSectionsMock
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(getSectionsTool.name).toBe('get_sections');
        expect(getSectionsTool.description).toContain('section');
        expect(getSectionsTool.parameters).toBeDefined();
        expect(getSectionsTool.parameters.project_id).toBeDefined();
    });

    test('handler fetches and returns sections', async () => {
        const result = await getSectionsTool.handler({ project_id: '1' }, mockClient);

        expect(result).toBeDefined();
        expect(result.content[0].type).toBe('text');

        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.sections).toHaveLength(3);
        expect(mockClient.getSections).toHaveBeenCalledWith('1');
    });

    test('returns correct section structure', async () => {
        const result = await getSectionsTool.handler({ project_id: '1' }, mockClient);
        const parsed = JSON.parse(result.content[0].text);

        expect(parsed.sections[0]).toEqual({
            id: 1,
            name: 'Login',
        });

        expect(parsed.sections[1]).toEqual({
            id: 2,
            name: 'Authentication',
        });
    });

    test('handler returns error on failure', async () => {
        getSectionsMock.mockRejectedValue(new Error('API Error'));

        const result = await getSectionsTool.handler({ project_id: '1' }, mockClient);

        expect(result).toEqual({
            content: [{ type: 'text', text: 'Error: API Error' }],
            isError: true
        });
    });
});
