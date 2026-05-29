import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { addCaseTool } from '../../../src/tools/cases/add_case.js';
import { TestRailClient } from '../../../src/client/testrail.js';
import { Case } from '../../../src/tools/cases/types.js';

describe('add_case tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let addCaseMock: jest.Mock<(sectionId: string, fields: Record<string, any>) => Promise<Case>>;

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
        addCaseMock = jest.fn<(sectionId: string, fields: Record<string, any>) => Promise<Case>>()
            .mockResolvedValue(mockCreatedCase);

        mockClient = {
            addCase: addCaseMock,
            getCaseFields: (jest.fn() as unknown as any).mockResolvedValue([{ system_name: 'priority_id', is_active: true, configs: [], include_all: true, template_ids: [] }, { system_name: 'template_id', is_active: true, configs: [], include_all: true, template_ids: [] }, { system_name: 'custom_automation_priority', is_active: true, configs: [], include_all: true, template_ids: [] }])
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(addCaseTool.name).toBe('add_case');
        expect(addCaseTool.description).toContain('Create');
        expect(addCaseTool.parameters).toBeDefined();
        expect(addCaseTool.parameters.section_id).toBeDefined();
        expect(addCaseTool.parameters.title).toBeDefined();
        expect(addCaseTool.parameters.fields).toBeDefined();
    });

    test('handler creates case and returns success response', async () => {
        const result = await addCaseTool.handler(
            { section_id: 1, title: 'New Test Case' },
            mockClient
        );

        expect(result).toBeDefined();
        expect(result.success).toBe(true);
        expect(result.case_id).toBe(456);
        expect(result.message).toContain('C456');
        expect(mockClient.addCase).toHaveBeenCalledWith(1, { title: 'New Test Case' });
    });

    test('passes title and optional fields correctly', async () => {
        const fields = {
            priority_id: 2,
            template_id: 1,
            custom_automation_priority: 1,
        };

        await addCaseTool.handler(
            { section_id: 5, title: 'My Test', fields },
            mockClient
        );

        expect(mockClient.addCase).toHaveBeenCalledWith(5, {
            title: 'My Test',
            priority_id: 2,
            template_id: 1,
            custom_automation_priority: 1,
        });
    });

    test('works without optional fields', async () => {
        await addCaseTool.handler(
            { section_id: 10, title: 'Simple Test' },
            mockClient
        );

        expect(mockClient.addCase).toHaveBeenCalledWith(10, { title: 'Simple Test' });
    });

    test('handler throws error on failure', async () => {
        addCaseMock.mockRejectedValue(new Error('API Error'));

        await expect(
            addCaseTool.handler(
                { section_id: 1, title: 'Test' },
                mockClient
            )
        ).rejects.toThrow('API Error');
    });
});
