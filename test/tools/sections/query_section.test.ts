import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { querySectionTool, buildSectionTree } from '../../../src/tools/sections/query_section.js';
import { TestRailClient } from '../../../src/client/testrail.js';
import { Section } from '../../../src/tools/sections/types.js';
import fs from 'fs';

describe('query_section tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let getSectionMock: jest.Mock<(sectionId: number) => Promise<Section>>;
    let getSectionsMock: jest.Mock<(projectId: number, suiteId?: number) => Promise<Section[]>>;

    const mockSingleSection: Section = {
        id: 1,
        name: 'Authentication',
        description: 'Auth tests',
        parent_id: null,
        suite_id: 1,
    };

    const mockHierarchySections: Section[] = [
        { id: 1, name: 'Authentication', description: 'Auth root', parent_id: null, suite_id: 1 },
        { id: 2, name: 'Login', description: 'Login tests', parent_id: 1, suite_id: 1 },
        { id: 3, name: 'OAuth', description: 'OAuth sub-tests', parent_id: 2, suite_id: 1 },
        { id: 4, name: 'Password Reset', description: 'Reset tests', parent_id: 1, suite_id: 1 },
        { id: 5, name: 'Billing', description: 'Billing root', parent_id: null, suite_id: 1 },
        { id: 6, name: 'Invoices', description: 'Invoice tests', parent_id: 5, suite_id: 1 },
    ];

    beforeEach(() => {
        jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);

        getSectionMock = jest.fn<(sectionId: number) => Promise<Section>>()
            .mockResolvedValue(mockSingleSection);

        getSectionsMock = jest.fn<(projectId: number, suiteId?: number) => Promise<Section[]>>()
            .mockResolvedValue(mockHierarchySections);

        mockClient = {
            getSection: getSectionMock,
            getSections: getSectionsMock,
            getProject: jest.fn<any>().mockResolvedValue({ id: 10, name: 'Test Project', is_completed: false, suite_mode: 1 }),
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(querySectionTool.name).toBe('query_section');
        expect(querySectionTool.mode).toBe('read');
        expect(querySectionTool.description).toContain('section');
        expect(querySectionTool.parameters).toBeDefined();
        expect(querySectionTool.parameters.payload).toBeDefined();
    });

    describe('action: "one"', () => {
        test('fetches a single section by section_id directly when include_child is false (default)', async () => {
            const result = await querySectionTool.handler({
                payload: {
                    action: 'one',
                    section_id: 1,
                }
            }, mockClient);

            expect(result).toBeDefined();
            expect(result.section).toBeDefined();
            expect(result.section.id).toBe(1);
            expect(result.section.name).toBe('Authentication');
            expect(result.section.children).toBeUndefined();
            expect(mockClient.getSection).toHaveBeenCalledWith(1);
            expect(mockClient.getSections).not.toHaveBeenCalled();
        });

        test('throws error when include_child is true but project_id is not provided', async () => {
            await expect(
                querySectionTool.handler({
                    payload: {
                        action: 'one',
                        section_id: 1,
                        include_child: true,
                    }
                }, mockClient)
            ).rejects.toThrow('project_id is required when include_child is true');
        });

        test('builds recursive child tree when include_child is true', async () => {
            const result = await querySectionTool.handler({
                payload: {
                    action: 'one',
                    section_id: 1,
                    project_id: 10,
                    include_child: true,
                }
            }, mockClient);

            expect(result).toBeDefined();
            expect(result.section).toBeDefined();
            expect(result.section.id).toBe(1);
            expect(result.section.name).toBe('Authentication');
            expect(result.section.children).toHaveLength(2); // Login (2) and Password Reset (4)

            const loginChild = result.section.children.find((c: any) => c.id === 2);
            expect(loginChild).toBeDefined();
            expect(loginChild.name).toBe('Login');
            expect(loginChild.children).toHaveLength(1); // OAuth (3)
            expect(loginChild.children[0].id).toBe(3);
            expect(loginChild.children[0].name).toBe('OAuth');
            expect(loginChild.children[0].children).toHaveLength(0);

            const resetChild = result.section.children.find((c: any) => c.id === 4);
            expect(resetChild).toBeDefined();
            expect(resetChild.name).toBe('Password Reset');
            expect(resetChild.children).toHaveLength(0);

            expect(mockClient.getSections).toHaveBeenCalledWith(10, undefined);
        });

        test('falls back to getSection if section is not found in getSections list when include_child is true', async () => {
            getSectionMock.mockResolvedValue({
                id: 99,
                name: 'External Section',
                description: null,
                parent_id: null,
                suite_id: 1,
            });

            const result = await querySectionTool.handler({
                payload: {
                    action: 'one',
                    section_id: 99,
                    project_id: 10,
                    include_child: true,
                }
            }, mockClient);

            expect(result.section.id).toBe(99);
            expect(result.section.name).toBe('External Section');
            expect(result.section.children).toEqual([]);
            expect(mockClient.getSection).toHaveBeenCalledWith(99);
        });
    });

    describe('action: "many"', () => {
        test('fetches and returns all sections for a project', async () => {
            const result = await querySectionTool.handler({
                payload: {
                    action: 'many',
                    project_id: 10,
                }
            }, mockClient);

            expect(result).toBeDefined();
            expect(result.sections).toHaveLength(6);
            expect(result.sections[0].name).toBe('Authentication');
            expect(mockClient.getSections).toHaveBeenCalledWith(10, undefined);
        });

        test('passes suite_id when provided', async () => {
            const result = await querySectionTool.handler({
                payload: {
                    action: 'many',
                    project_id: 10,
                    suite_id: 5,
                }
            }, mockClient);

            expect(result).toBeDefined();
            expect(mockClient.getSections).toHaveBeenCalledWith(10, 5);
        });

        test('filters sections by name_pattern regex (case-insensitive)', async () => {
            const result = await querySectionTool.handler({
                payload: {
                    action: 'many',
                    project_id: 10,
                    name_pattern: 'auth|login',
                }
            }, mockClient);

            expect(result).toBeDefined();
            expect(result.sections).toHaveLength(3);
            const names = result.sections.map((s: any) => s.name);
            expect(names).toEqual(['Authentication', 'Login', 'OAuth']);
        });

        test('filters sections by substring pattern', async () => {
            const result = await querySectionTool.handler({
                payload: {
                    action: 'many',
                    project_id: 10,
                    name_pattern: 'bill',
                }
            }, mockClient);

            expect(result.sections).toHaveLength(1);
            expect(result.sections[0].name).toBe('Billing');
        });

        test('throws descriptive error on invalid regex in name_pattern', async () => {
            await expect(
                querySectionTool.handler({
                    payload: {
                        action: 'many',
                        project_id: 10,
                        name_pattern: '[unclosed-bracket',
                    }
                }, mockClient)
            ).rejects.toThrow("Invalid regex pattern provided for name_pattern: '[unclosed-bracket'");
        });

        test('saves output to file if output_file is provided', async () => {
            const result = await querySectionTool.handler({
                payload: {
                    action: 'many',
                    project_id: 10,
                    output_file: '/tmp/sections_export.json',
                }
            }, mockClient);

            expect(result.success).toBe(true);
            expect(result.file).toBe('/tmp/sections_export.json');
            expect(result.message).toContain('6 sections');
            expect(result.sections).toBeUndefined();

            expect(fs.promises.writeFile).toHaveBeenCalledWith(
                '/tmp/sections_export.json',
                expect.any(String),
                'utf-8'
            );

            const writtenJson = (fs.promises.writeFile as jest.Mock).mock.calls[0][1] as string;
            const parsed = JSON.parse(writtenJson);
            expect(parsed.sections).toHaveLength(6);
        });

        test('enforces suite_id for multi-suite projects', async () => {
            mockClient.getProject.mockResolvedValue({ id: 10, name: 'Multi Suite Project', is_completed: false, suite_mode: 3 });

            await expect(
                querySectionTool.handler({
                    payload: {
                        action: 'many',
                        project_id: 10,
                    }
                }, mockClient)
            ).rejects.toThrow('suite_id parameter is required');
        });
    });

    test('propagates client API errors', async () => {
        getSectionMock.mockRejectedValue(new Error('Network error'));

        await expect(
            querySectionTool.handler({
                payload: {
                    action: 'one',
                    section_id: 1,
                }
            }, mockClient)
        ).rejects.toThrow('Network error');
    });

    test('buildSectionTree correctly links multi-level hierarchies', () => {
        const rootSection: Section = { id: 1, name: 'Root', description: null, parent_id: null, suite_id: 1 };
        const tree = buildSectionTree(rootSection, mockHierarchySections);

        expect(tree.id).toBe(1);
        expect(tree.children).toHaveLength(2);
        expect(tree.children![0].id).toBe(2);
        expect(tree.children![0].children![0].id).toBe(3);
    });
});
