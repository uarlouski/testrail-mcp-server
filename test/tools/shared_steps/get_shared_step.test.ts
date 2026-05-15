import { jest } from '@jest/globals';
import { getSharedStepTool } from '../../../src/tools/shared_steps/get_shared_step.js';
import { TestRailClient } from '../../../src/client/testrail.js';

describe('get_shared_step tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;

    beforeEach(() => {
        mockClient = {
            getSharedStep: jest.fn(),
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(getSharedStepTool.name).toBe('get_shared_step');
        expect(getSharedStepTool.description).toContain('Returns the details of a specific shared test step');
        expect(getSharedStepTool.parameters).toBeDefined();
    });

    test('calls client.getSharedStep with shared_step_id', async () => {
        const mockSharedStep = { 
            id: 28, 
            title: 'Open store', 
            project_id: 10,
            custom_steps_separated: [
                { content: 'Open Store from Precondition', expected: 'Store is opened' }
            ]
        };

        mockClient.getSharedStep.mockResolvedValue(mockSharedStep as any);

        const args = {
            shared_step_id: 28
        };

        const result = await getSharedStepTool.handler(args, mockClient);

        expect(mockClient.getSharedStep).toHaveBeenCalledWith(28);
        expect(result).toEqual({ shared_step: mockSharedStep });
    });
});
