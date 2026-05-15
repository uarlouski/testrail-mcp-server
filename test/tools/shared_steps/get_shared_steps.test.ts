import { jest } from '@jest/globals';
import { getSharedStepsTool } from '../../../src/tools/shared_steps/get_shared_steps.js';
import { TestRailClient } from '../../../src/client/testrail.js';

describe('get_shared_steps tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;

    beforeEach(() => {
        mockClient = {
            getSharedSteps: jest.fn(),
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(getSharedStepsTool.name).toBe('get_shared_steps');
        expect(getSharedStepsTool.description).toContain('Returns a list of shared test steps');
        expect(getSharedStepsTool.parameters).toBeDefined();
    });

    test('calls client.getSharedSteps with project_id and options', async () => {
        const mockSharedSteps = [
            { id: 1, title: 'Login', project_id: 1 }
        ];

        mockClient.getSharedSteps.mockResolvedValue(mockSharedSteps as any);

        const args = {
            project_id: 1,
            refs: 'R1'
        };

        const result = await getSharedStepsTool.handler(args, mockClient);

        expect(mockClient.getSharedSteps).toHaveBeenCalledWith(1, {
            refs: 'R1'
        });

        expect(result).toEqual({ shared_steps: mockSharedSteps });
    });
});
