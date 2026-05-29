import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { getConfigurationsTool } from '../../src/tools/get_configurations.js';
import { TestRailClient } from '../../src/client/testrail.js';
import { ConfigurationGroup } from '../../src/types/testrail.js';

describe('get_configurations tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let getConfigsMock: jest.Mock<(projectId: number) => Promise<ConfigurationGroup[]>>;

    const mockConfigs: ConfigurationGroup[] = [
        {
            id: 1,
            name: 'Operating Systems',
            project_id: 1,
            configs: [
                {
                    id: 10,
                    name: 'Windows 11',
                    group_id: 1
                }
            ]
        }
    ];

    beforeEach(() => {
        getConfigsMock = jest.fn<(projectId: number) => Promise<ConfigurationGroup[]>>()
            .mockResolvedValue(mockConfigs);

        mockClient = {
            getConfigs: getConfigsMock
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(getConfigurationsTool.name).toBe('get_configurations');
        expect(getConfigurationsTool.description).toContain('all configuration groups');
        expect(getConfigurationsTool.parameters).toBeDefined();
        expect(getConfigurationsTool.parameters.project_id).toBeDefined();
    });

    test('handler fetches and returns configurations', async () => {
        const result = await getConfigurationsTool.handler({ project_id: 1 }, mockClient);

        expect(result).toBeDefined();
        expect(result.configurations).toHaveLength(1);
        expect(result.configurations[0].id).toBe(1);
        expect(result.configurations[0].configs).toHaveLength(1);
        expect(result.configurations[0].configs[0].name).toBe('Windows 11');
        expect(mockClient.getConfigs).toHaveBeenCalledWith(1);
    });
});
