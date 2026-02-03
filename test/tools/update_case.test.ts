import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { updateCaseTool } from '../../src/tools/update_case.js';
import { TestRailClient } from '../../src/client/testrail.js';
import { Case } from '../../src/types/testrail.js';

describe('update_case tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let updateCaseMock: jest.Mock<(caseId: string, fields: Record<string, any>) => Promise<Case>>;

    const mockUpdatedCase: Case = {
        id: 123,
        title: 'Updated Title',
        section_id: 1,
        template_id: 1,
        type_id: 1,
        priority_id: 2,
        milestone_id: null,
        refs: null,
        created_by: 1,
        created_on: 1700000000,
        updated_by: 1,
        updated_on: 1700000001,
        estimate: null,
        estimate_forecast: null,
        suite_id: 1,
        display_order: 1,
        is_deleted: 0,
        labels: [],
    };

    beforeEach(() => {
        updateCaseMock = jest.fn<(caseId: string, fields: Record<string, any>) => Promise<Case>>()
            .mockResolvedValue(mockUpdatedCase);

        mockClient = {
            updateCase: updateCaseMock
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(updateCaseTool.name).toBe('update_case');
        expect(updateCaseTool.description).toContain('Update');
        expect(updateCaseTool.parameters).toBeDefined();
        expect(updateCaseTool.parameters.case_id).toBeDefined();
        expect(updateCaseTool.parameters.fields).toBeDefined();
    });

    test('handler updates case and returns success response', async () => {
        const result = await updateCaseTool.handler(
            { case_id: '123', fields: { title: 'Updated Title' } },
            mockClient
        );

        expect(result).toBeDefined();
        expect(result.content[0].type).toBe('text');

        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.success).toBe(true);
        expect(parsed.case_id).toBe(123);
        expect(parsed.message).toContain('C123');
        expect(mockClient.updateCase).toHaveBeenCalledWith('123', { title: 'Updated Title' });
    });

    test('strips C prefix from case_id', async () => {
        await updateCaseTool.handler(
            { case_id: 'C456', fields: { title: 'New Title' } },
            mockClient
        );

        expect(mockClient.updateCase).toHaveBeenCalledWith('456', { title: 'New Title' });
    });

    test('handles lowercase c prefix', async () => {
        await updateCaseTool.handler(
            { case_id: 'c789', fields: { priority_id: 3 } },
            mockClient
        );

        expect(mockClient.updateCase).toHaveBeenCalledWith('789', { priority_id: 3 });
    });

    test('passes multiple fields correctly', async () => {
        const fields = {
            title: 'New Title',
            priority_id: 2,
            custom_automation_priority: 1,
            refs: 'JIRA-123',
        };

        await updateCaseTool.handler({ case_id: '123', fields }, mockClient);

        expect(mockClient.updateCase).toHaveBeenCalledWith('123', fields);
    });

    test('handler returns error on failure', async () => {
        updateCaseMock.mockRejectedValue(new Error('API Error'));

        const result = await updateCaseTool.handler(
            { case_id: '123', fields: { title: 'Test' } },
            mockClient
        );

        expect(result).toEqual({
            content: [{ type: 'text', text: 'Error: API Error' }],
            isError: true
        });
    });
});
