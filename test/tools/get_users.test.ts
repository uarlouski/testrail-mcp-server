import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { getUsersTool } from '../../src/tools/get_users.js';
import { TestRailClient } from '../../src/client/testrail.js';
import { User } from '../../src/types/testrail.js';

describe('get_users tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let getUsersMock: jest.Mock<(projectId?: number) => Promise<User[]>>;
    let getProjectsMock: jest.Mock<() => Promise<any[]>>;

    const mockUsers: User[] = [
        { id: 1, name: 'Alice Cooper', email: 'alice@rock.com' },
        { id: 2, name: 'Bob Dylan', email: 'bob@folk.com' },
    ];

    const mockProjectUsers: User[] = [
        { id: 2, name: 'Bob Dylan', email: 'bob@folk.com' },
    ];

    beforeEach(() => {
        getUsersMock = jest.fn<(projectId?: number) => Promise<User[]>>()
            .mockResolvedValue(mockUsers);

        getProjectsMock = jest.fn<() => Promise<any[]>>()
            .mockResolvedValue([]);

        mockClient = {
            getUsers: getUsersMock,
            getProjects: getProjectsMock,
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(getUsersTool.name).toBe('get_users');
        expect(getUsersTool.description).toContain('users');
        expect(getUsersTool.parameters).toBeDefined();
        expect(getUsersTool.parameters.project_id).toBeDefined();
        expect(getUsersTool.parameters.fallback_all_projects).toBeDefined();
        expect((getUsersTool.parameters as any).output_file).toBeUndefined();
    });

    test('handler fetches and returns users globally', async () => {
        const result = await getUsersTool.handler({ fallback_all_projects: true }, mockClient);

        expect(result).toBeDefined();
        expect(result.users).toHaveLength(2);
        expect(result.users[0]).toEqual({ id: 1, name: 'Alice Cooper', email: 'alice@rock.com' });
        expect(mockClient.getUsers).toHaveBeenCalledWith(undefined);
    });

    test('handler fetches and returns users for specific project', async () => {
        getUsersMock.mockResolvedValue(mockProjectUsers);
        const result = await getUsersTool.handler({ project_id: 1, fallback_all_projects: true }, mockClient);

        expect(result).toBeDefined();
        expect(result.users).toHaveLength(1);
        expect(result.users[0]).toEqual({ id: 2, name: 'Bob Dylan', email: 'bob@folk.com' });
        expect(mockClient.getUsers).toHaveBeenCalledWith(1);
    });

    test('handler falls back to multi-project user resolution when global fetch throws 403', async () => {
        getUsersMock.mockImplementation(async (projectId?: number) => {
            if (projectId === undefined) {
                throw new Error('TestRail API Error: 403 Forbidden - Access Denied');
            }
            if (projectId === 10) {
                return [{ id: 1, name: 'Alice Cooper', email: 'alice@rock.com' }];
            }
            if (projectId === 12) {
                return [
                    { id: 1, name: 'Alice Cooper', email: 'alice@rock.com' },
                    { id: 2, name: 'Bob Dylan', email: 'bob@folk.com' }
                ];
            }
            return [];
        });

        getProjectsMock.mockResolvedValue([
            { id: 10, name: 'Project A', is_completed: false },
            { id: 11, name: 'Project B', is_completed: true },
            { id: 12, name: 'Project C', is_completed: false }
        ]);

        const result = await getUsersTool.handler({ fallback_all_projects: true }, mockClient);

        expect(result).toBeDefined();
        expect(result.users).toHaveLength(2);
        expect(result.users[0]).toEqual({ id: 1, name: 'Alice Cooper', email: 'alice@rock.com' });
        expect(result.users[1]).toEqual({ id: 2, name: 'Bob Dylan', email: 'bob@folk.com' });
        expect(mockClient.getProjects).toHaveBeenCalled();
        expect(mockClient.getUsers).toHaveBeenCalledWith(undefined);
        expect(mockClient.getUsers).toHaveBeenCalledWith(10);
        expect(mockClient.getUsers).toHaveBeenCalledWith(12);
        expect(mockClient.getUsers).not.toHaveBeenCalledWith(11);
    });

    test('handler does not fall back if fallback_all_projects is set to false', async () => {
        const testError = new Error('TestRail API Error: 403 Forbidden - Access Denied');
        getUsersMock.mockRejectedValue(testError);

        await expect(
            getUsersTool.handler({ fallback_all_projects: false }, mockClient)
        ).rejects.toThrow(testError);

        expect(mockClient.getProjects).not.toHaveBeenCalled();
    });
});
