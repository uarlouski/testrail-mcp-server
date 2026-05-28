import { jest } from '@jest/globals';
import { deleteEntityTool } from '../../src/tools/delete_entity.js';
import { TestRailClient } from '../../src/client/testrail.js';

describe('delete_entity tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;

    beforeEach(() => {
        mockClient = {
            deleteCase: jest.fn(),
            deleteSharedStep: jest.fn(),
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('calls client.deleteCase when entity_type is case', async () => {
        const result = await deleteEntityTool.handler({ entity_type: 'case', entity_id: 123 }, mockClient);
        expect(mockClient.deleteCase).toHaveBeenCalledWith(123);
        expect(mockClient.deleteSharedStep).not.toHaveBeenCalled();
        expect(result.message).toBe('Case 123 deleted successfully.');
    });

    test('calls client.deleteSharedStep when entity_type is shared_step', async () => {
        const result = await deleteEntityTool.handler({ entity_type: 'shared_step', entity_id: 456 }, mockClient);
        expect(mockClient.deleteSharedStep).toHaveBeenCalledWith(456);
        expect(mockClient.deleteCase).not.toHaveBeenCalled();
        expect(result.message).toBe('Shared step 456 deleted successfully.');
    });
});
