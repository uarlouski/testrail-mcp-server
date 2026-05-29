import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { getSectionsTool } from '../../../src/tools/sections/get_sections.js';
import { TestRailClient } from '../../../src/client/testrail.js';
import { Section } from '../../../src/tools/sections/types.js';
import fs from 'fs';

describe('get_sections tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let getSectionsMock: jest.Mock<(projectId: string) => Promise<Section[]>>;

    const mockSections: Section[] = [
        { id: 1, name: 'Login', description: null, parent_id: null, suite_id: 1 },
        { id: 2, name: 'Authentication', description: 'Auth tests', parent_id: 1, suite_id: 1 },
        { id: 3, name: 'Registration', description: null, parent_id: null, suite_id: 1 },
    ];

    beforeEach(() => {
        jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);

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
        const result = await getSectionsTool.handler({ project_id: 1 }, mockClient);
        
        expect(result).toBeDefined();
        expect(result.sections).toHaveLength(3);
        expect(result.sections[0].name).toBe('Login');
    });

    test('saves output to file if output_file is provided', async () => {
        const result = await getSectionsTool.handler(
            { project_id: 1, output_file: '/tmp/sections.json' },
            mockClient
        );

        expect(result.success).toBe(true);
        expect(result.file).toBe('/tmp/sections.json');
        expect(result.message).toContain('3 sections');
        expect(result.sections).toBeUndefined();
        
        expect(fs.promises.writeFile).toHaveBeenCalledWith(
            '/tmp/sections.json',
            expect.any(String),
            'utf-8'
        );
        
        const writtenJson = (fs.promises.writeFile as jest.Mock).mock.calls[0][1] as string;
        const parsed = JSON.parse(writtenJson);
        expect(parsed.sections).toHaveLength(3);
    });

    test('handler throws error on failure', async () => {
        getSectionsMock.mockRejectedValue(new Error('API Error'));

        await expect(
            getSectionsTool.handler({ project_id: 1 }, mockClient)
        ).rejects.toThrow('API Error');
    });
});
