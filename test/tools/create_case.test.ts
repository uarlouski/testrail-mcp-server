import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { createCaseTool } from '../../src/tools/create_case.js';
import { TestRailClient } from '../../src/client/testrail.js';
import { Case } from '../../src/types/testrail.js';

describe('create_case tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let createCaseMock: jest.Mock<(sectionId: string, fields: Record<string, any>) => Promise<Case>>;

    const mockCreatedCase: Case = {
        id: 456,
        title: 'New Test Case',
        section_id: 1,
        template_id: 1,
        type_id: 1,
        priority_id: 2,
        milestone_id: null,
        refs: null,
        created_by: 1,
        created_on: 1700000000,
        updated_by: 1,
        updated_on: 1700000000,
        estimate: null,
        estimate_forecast: null,
        suite_id: 1,
        display_order: 1,
        is_deleted: 0,
        labels: [],
    };

    beforeEach(() => {
        createCaseMock = jest.fn<(sectionId: string, fields: Record<string, any>) => Promise<Case>>()
            .mockResolvedValue(mockCreatedCase);

        mockClient = {
            createCase: createCaseMock
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(createCaseTool.name).toBe('create_case');
        expect(createCaseTool.description).toContain('Create');
        expect(createCaseTool.parameters).toBeDefined();
        expect(createCaseTool.parameters.section_id).toBeDefined();
        expect(createCaseTool.parameters.title).toBeDefined();
        expect(createCaseTool.parameters.fields).toBeDefined();
    });

    test('handler creates case and returns success response', async () => {
        const result = await createCaseTool.handler(
            { section_id: '1', title: 'New Test Case' },
            mockClient
        );

        expect(result).toBeDefined();
        expect(result.content[0].type).toBe('text');

        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.success).toBe(true);
        expect(parsed.case_id).toBe(456);
        expect(parsed.message).toContain('C456');
        expect(mockClient.createCase).toHaveBeenCalledWith('1', { title: 'New Test Case' });
    });

    test('passes title and optional fields correctly', async () => {
        const fields = {
            priority_id: 2,
            template_id: 1,
            custom_automation_priority: 1,
        };

        await createCaseTool.handler(
            { section_id: '5', title: 'My Test', fields },
            mockClient
        );

        expect(mockClient.createCase).toHaveBeenCalledWith('5', {
            title: 'My Test',
            priority_id: 2,
            template_id: 1,
            custom_automation_priority: 1,
        });
    });

    test('works without optional fields', async () => {
        await createCaseTool.handler(
            { section_id: '10', title: 'Simple Test' },
            mockClient
        );

        expect(mockClient.createCase).toHaveBeenCalledWith('10', { title: 'Simple Test' });
    });

    test('handler returns error on failure', async () => {
        createCaseMock.mockRejectedValue(new Error('API Error'));

        const result = await createCaseTool.handler(
            { section_id: '1', title: 'Test' },
            mockClient
        );

        expect(result).toEqual({
            content: [{ type: 'text', text: 'Error: API Error' }],
            isError: true
        });
    });
});
