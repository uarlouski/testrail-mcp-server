import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { getSectionsTool } from '../../src/tools/get_sections.js';
import { TestRailClient } from '../../src/client/testrail.js';
import { Section } from '../../src/types/testrail.js';

describe('get_sections tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let getSectionsMock: jest.Mock<(projectId: string) => Promise<Section[]>>;

    const mockSections: Section[] = [
        { id: 1, name: 'Login', description: null, parent_id: null, suite_id: 1 },
        { id: 2, name: 'Authentication', description: 'Auth tests', parent_id: 1, suite_id: 1 },
        { id: 3, name: 'Registration', description: null, parent_id: null, suite_id: 1 },
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

    test('handler throws error on failure', async () => {
        getSectionsMock.mockRejectedValue(new Error('API Error'));

        await expect(
            getSectionsTool.handler({ project_id: '1' }, mockClient)
        ).rejects.toThrow('API Error');
    });
});
