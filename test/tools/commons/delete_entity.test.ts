import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { deleteEntityTool } from '../../../src/tools/commons/delete_entity.js';
import { TestRailClient } from '../../../src/client/testrail.js';

describe('delete_entity tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;

    beforeEach(() => {
        mockClient = {
            deleteCase: jest.fn(),
            deleteSharedStep: jest.fn(),
            deleteAttachment: jest.fn(),
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('calls client.deleteCase when entity_type is case', async () => {
        const result = await deleteEntityTool.handler({ entity_type: 'case', entity_id: 123 }, mockClient);
        expect(mockClient.deleteCase).toHaveBeenCalledWith(123);
        expect(mockClient.deleteSharedStep).not.toHaveBeenCalled();
        expect(mockClient.deleteAttachment).not.toHaveBeenCalled();
        expect(result.message).toBe('Case 123 deleted successfully.');
    });

    test('calls client.deleteSharedStep when entity_type is shared_step', async () => {
        const result = await deleteEntityTool.handler({ entity_type: 'shared_step', entity_id: 456 }, mockClient);
        expect(mockClient.deleteSharedStep).toHaveBeenCalledWith(456);
        expect(mockClient.deleteCase).not.toHaveBeenCalled();
        expect(mockClient.deleteAttachment).not.toHaveBeenCalled();
        expect(result.message).toBe('Shared step 456 deleted successfully.');
    });

    test('calls client.deleteAttachment when entity_type is attachment', async () => {
        const result = await deleteEntityTool.handler({ entity_type: 'attachment', entity_id: 789 }, mockClient);
        expect(mockClient.deleteAttachment).toHaveBeenCalledWith(789);
        expect(mockClient.deleteCase).not.toHaveBeenCalled();
        expect(mockClient.deleteSharedStep).not.toHaveBeenCalled();
        expect(result.message).toBe('Attachment 789 deleted successfully.');
    });

    test('throws error for unsupported entity type', async () => {
        await expect(deleteEntityTool.handler({ entity_type: 'unknown' as any, entity_id: 999 }, mockClient)).rejects.toThrow('Unsupported entity type: unknown');
    });
});
