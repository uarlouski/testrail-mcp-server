import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { getTemplatesTool } from '../../src/tools/get_templates.js';
import { TestRailClient } from '../../src/client/testrail.js';
import { Template } from '../../src/types/testrail.js';

describe('get_templates tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let getTemplatesMock: jest.Mock<(projectId: string) => Promise<Template[]>>;

    const mockTemplates: Template[] = [
        { id: 1, name: 'Test Case (Text)', is_default: false },
        { id: 2, name: 'Test Case (Steps)', is_default: true },
        { id: 3, name: 'Exploratory Session', is_default: false },
    ];

    beforeEach(() => {
        getTemplatesMock = jest.fn<(projectId: string) => Promise<Template[]>>().mockResolvedValue(mockTemplates);

        mockClient = {
            getTemplates: getTemplatesMock
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(getTemplatesTool.name).toBe('get_templates');
        expect(getTemplatesTool.description).toContain('template');
        expect(getTemplatesTool.parameters).toBeDefined();
        expect(getTemplatesTool.parameters.project_id).toBeDefined();
    });

    test('handler fetches and returns templates', async () => {
        const result = await getTemplatesTool.handler({ project_id: '1' }, mockClient);

        expect(result).toBeDefined();
        expect(result.content[0].type).toBe('text');

        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.templates).toHaveLength(3);
        expect(mockClient.getTemplates).toHaveBeenCalledWith('1');
    });

    test('returns correct template structure', async () => {
        const result = await getTemplatesTool.handler({ project_id: '1' }, mockClient);
        const parsed = JSON.parse(result.content[0].text);

        expect(parsed.templates[0]).toEqual({
            id: 1,
            name: 'Test Case (Text)',
        });

        expect(parsed.templates[1]).toEqual({
            id: 2,
            name: 'Test Case (Steps)',
        });
    });

    test('handler returns error on failure', async () => {
        getTemplatesMock.mockRejectedValue(new Error('API Error'));

        const result = await getTemplatesTool.handler({ project_id: '1' }, mockClient);

        expect(result).toEqual({
            content: [{ type: 'text', text: 'Error: API Error' }],
            isError: true
        });
    });
});
