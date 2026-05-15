import { jest } from '@jest/globals';
import { getSharedStepHistoryTool } from '../../../src/tools/shared_steps/get_shared_step_history.js';
import { addSharedStepTool } from '../../../src/tools/shared_steps/add_shared_step.js';
import { updateSharedStepTool } from '../../../src/tools/shared_steps/update_shared_step.js';
import { deleteSharedStepTool } from '../../../src/tools/shared_steps/delete_shared_step.js';
import { TestRailClient } from '../../../src/client/testrail.js';

describe('Shared Step Management Tools', () => {
    let mockClient: jest.Mocked<TestRailClient>;

    beforeEach(() => {
        mockClient = {
            getSharedStepHistory: jest.fn(),
            addSharedStep: jest.fn(),
            updateSharedStep: jest.fn(),
            deleteSharedStep: jest.fn(),
        } as unknown as jest.Mocked<TestRailClient>;
    });

    describe('get_shared_step_history', () => {
        test('calls client.getSharedStepHistory', async () => {
            const mockHistory = [{ id: 1, title: 'Initial Version' }];
            mockClient.getSharedStepHistory.mockResolvedValue(mockHistory as any);
            const result = await getSharedStepHistoryTool.handler({ shared_step_id: 1 }, mockClient);
            expect(mockClient.getSharedStepHistory).toHaveBeenCalledWith(1);
            expect(result).toEqual({ history: mockHistory });
        });
    });

    describe('add_shared_step', () => {
        test('calls client.addSharedStep with title and steps', async () => {
            const mockStep = { id: 1, title: 'New Step' };
            mockClient.addSharedStep.mockResolvedValue(mockStep as any);
            const args = { 
                project_id: 10, 
                title: 'New Step',
                custom_steps_separated: [
                    { content: 'Step 1', expected: 'Result 1' }
                ]
            };
            const result = await addSharedStepTool.handler(args, mockClient);
            expect(mockClient.addSharedStep).toHaveBeenCalledWith(10, { 
                title: 'New Step',
                custom_steps_separated: [
                    { content: 'Step 1', expected: 'Result 1' }
                ]
            });
            expect(result).toEqual({ shared_step: mockStep });
        });
    });

    describe('update_shared_step', () => {
        test('calls client.updateSharedStep with updated steps', async () => {
            const mockStep = { id: 1, title: 'Updated' };
            mockClient.updateSharedStep.mockResolvedValue(mockStep as any);
            const args = { 
                shared_step_id: 1, 
                custom_steps_separated: [
                    { content: 'Updated Step', expected: 'Updated Result' }
                ]
            };
            const result = await updateSharedStepTool.handler(args, mockClient);
            expect(mockClient.updateSharedStep).toHaveBeenCalledWith(1, { 
                custom_steps_separated: [
                    { content: 'Updated Step', expected: 'Updated Result' }
                ]
            });
            expect(result).toEqual({ shared_step: mockStep });
        });
    });

    describe('delete_shared_step', () => {
        test('calls client.deleteSharedStep', async () => {
            const result = await deleteSharedStepTool.handler({ shared_step_id: 1 }, mockClient);
            expect(mockClient.deleteSharedStep).toHaveBeenCalledWith(1);
            expect(result.message).toContain('deleted successfully');
        });
    });
});
