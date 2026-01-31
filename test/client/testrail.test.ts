import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { TestRailClient } from '../../src/client/testrail.js';
import axios, { AxiosInstance, AxiosError } from 'axios';

describe('TestRailClient', () => {
    let client: TestRailClient;
    let mockAxiosInstance: any;

    beforeEach(() => {
        // Create a simple object mock for AxiosInstance to avoid complex mocking types
        mockAxiosInstance = {
            get: jest.fn(),
            defaults: { headers: { common: {} } },
            interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }
        };

        // Mock axios.create to return our mock instance - using type casting to bypass TS warnings
        jest.spyOn(axios, 'create').mockReturnValue(mockAxiosInstance);

        // Pass the mock instance directly to constructor
        client = new TestRailClient('https://testrail.io', 'user', 'apikey');
    });

    test('getCase returns data on success', async () => {
        const mockData = { id: 1, title: 'Test Case', template_id: 1 };
        mockAxiosInstance.get.mockResolvedValue({ data: mockData });

        const result = await client.getCase('1');
        expect(result).toEqual(mockData);
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/index.php?/api/v2/get_case/1');
    });

    test('getCase throws formatted error on API error', async () => {
        const mockError = {
            message: 'Request failed',
            response: {
                status: 404,
                statusText: 'Not Found',
                data: { error: 'Case not found' }
            },
            isAxiosError: true,
            toJSON: () => ({})
        };

        mockAxiosInstance.get.mockRejectedValue(mockError);

        await expect(client.getCase('999')).rejects.toThrow(
            'TestRail API error: 404 Not Found - {"error":"Case not found"}'
        );
    });
    test('getSection returns data on success', async () => {
        const mockData = {
            id: 1,
            name: 'Section 1',
            description: null,
            parent_id: null,
            depth: 0,
            display_order: 1,
            suite_id: 1
        };
        mockAxiosInstance.get.mockResolvedValue({ data: mockData });

        const result = await client.getSection('1');
        expect(result).toEqual(mockData);
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/index.php?/api/v2/get_section/1');
    });
    test('getPriorities returns data on success', async () => {
        const mockData = [{
            id: 1,
            is_default: true,
            name: 'Low',
            priority: 1,
            short_name: 'Low'
        }];
        mockAxiosInstance.get.mockResolvedValue({ data: mockData });

        const result = await client.getPriorities();
        expect(result).toEqual(mockData);
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/index.php?/api/v2/get_priorities');
    });

    test('getCaseTypes returns data on success', async () => {
        const mockData = [{
            id: 1,
            is_default: true,
            name: 'Automated'
        }];
        mockAxiosInstance.get.mockResolvedValue({ data: mockData });

        const result = await client.getCaseTypes();
        expect(result).toEqual(mockData);
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/index.php?/api/v2/get_case_types');
    });
});
