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
            post: jest.fn(),
            defaults: { headers: { common: {} } },
            interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }
        };

        // Mock axios.create to return our mock instance - using type casting to bypass TS warnings
        jest.spyOn(axios, 'create').mockReturnValue(mockAxiosInstance);

        // Pass the mock instance directly to constructor
        client = new TestRailClient('https://testrail.io/', 'user', 'apikey');
    });

    test('constructor cleans trailing slash from baseUrl', async () => {
        const mockData = { id: 1, title: 'Test Case', template_id: 1 };
        mockAxiosInstance.get.mockResolvedValue({ data: mockData });

        await client.getCase('1');

        // Verify axios.create was called with cleaned URL (no trailing slash)
        expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({
            baseURL: 'https://testrail.io'
        }));
    });

    test('validateStatus returns true for 2xx status codes', () => {
        // Get the config passed to axios.create
        const createCall = (axios.create as jest.Mock).mock.calls[0][0] as { validateStatus: (status: number) => boolean };
        const validateStatus = createCall.validateStatus;

        expect(validateStatus(200)).toBe(true);
        expect(validateStatus(201)).toBe(true);
        expect(validateStatus(299)).toBe(true);
    });

    test('validateStatus returns false for non-2xx status codes', () => {
        // Get the config passed to axios.create
        const createCall = (axios.create as jest.Mock).mock.calls[0][0] as { validateStatus: (status: number) => boolean };
        const validateStatus = createCall.validateStatus;

        expect(validateStatus(199)).toBe(false);
        expect(validateStatus(300)).toBe(false);
        expect(validateStatus(400)).toBe(false);
        expect(validateStatus(500)).toBe(false);
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

    test('getCases returns cases without pagination', async () => {
        const mockCases = [{ id: 1, title: 'Case 1' }, { id: 2, title: 'Case 2' }];
        mockAxiosInstance.get.mockResolvedValue({
            data: { cases: mockCases, _links: { next: null } }
        });

        const result = await client.getCases('1');
        expect(result).toEqual(mockCases);
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/index.php?/api/v2/get_cases/1');
    });

    test('getCases handles response with undefined _links', async () => {
        const mockCases = [{ id: 1, title: 'Case 1' }];
        mockAxiosInstance.get.mockResolvedValue({
            data: { cases: mockCases }
        });

        const result = await client.getCases('1');
        expect(result).toEqual(mockCases);
    });

    test('getCases handles pagination', async () => {
        const page1Cases = [{ id: 1, title: 'Case 1' }];
        const page2Cases = [{ id: 2, title: 'Case 2' }];

        mockAxiosInstance.get
            .mockResolvedValueOnce({
                data: { cases: page1Cases, _links: { next: '/api/v2/get_cases/1&offset=1' } }
            })
            .mockResolvedValueOnce({
                data: { cases: page2Cases, _links: { next: null } }
            });

        const result = await client.getCases('1');
        expect(result).toEqual([...page1Cases, ...page2Cases]);
        expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });

    test('getCases with sectionId adds section filter', async () => {
        mockAxiosInstance.get.mockResolvedValue({
            data: { cases: [], _links: { next: null } }
        });

        await client.getCases('1', '5');
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/index.php?/api/v2/get_cases/1&section_id=5');
    });

    test('getCases with filter adds query params', async () => {
        mockAxiosInstance.get.mockResolvedValue({
            data: { cases: [], _links: { next: null } }
        });

        await client.getCases('1', undefined, { type_id: '1', priority_id: '2' });
        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
            '/index.php?/api/v2/get_cases/1&type_id=1&priority_id=2'
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

    test('getPriorities caches result', async () => {
        const mockData = [{ id: 1, name: 'Low' }];
        mockAxiosInstance.get.mockResolvedValue({ data: mockData });

        await client.getPriorities();
        await client.getPriorities();

        expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
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

    test('getCaseFields returns data on success', async () => {
        const mockData = [{
            id: 1,
            name: 'custom_field',
            system_name: 'custom_field',
            label: 'Custom Field',
            type_id: 1
        }];
        mockAxiosInstance.get.mockResolvedValue({ data: mockData });

        const result = await client.getCaseFields();
        expect(result).toEqual(mockData);
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/index.php?/api/v2/get_case_fields');
    });

    test('getCaseFields caches result', async () => {
        const mockData = [{ id: 1, name: 'field' }];
        mockAxiosInstance.get.mockResolvedValue({ data: mockData });

        await client.getCaseFields();
        await client.getCaseFields();

        expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
    });

    test('getTemplates returns data on success', async () => {
        const mockData = [{ id: 1, name: 'Test Template', is_default: true }];
        mockAxiosInstance.get.mockResolvedValue({ data: mockData });

        const result = await client.getTemplates('1');
        expect(result).toEqual(mockData);
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/index.php?/api/v2/get_templates/1');
    });

    test('getTemplates caches result per project', async () => {
        const mockData1 = [{ id: 1, name: 'Template 1' }];
        const mockData2 = [{ id: 2, name: 'Template 2' }];
        mockAxiosInstance.get
            .mockResolvedValueOnce({ data: mockData1 })
            .mockResolvedValueOnce({ data: mockData2 });

        await client.getTemplates('1');
        await client.getTemplates('1');
        await client.getTemplates('2');

        expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });

    test('updateCase sends POST request', async () => {
        const mockData = { id: 1, title: 'Updated Case' };
        mockAxiosInstance.post.mockResolvedValue({ data: mockData });

        const result = await client.updateCase('1', { title: 'Updated Case' });
        expect(result).toEqual(mockData);
        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
            '/index.php?/api/v2/update_case/1',
            { title: 'Updated Case' }
        );
    });

    test('updateCases gets suite_id from first case and updates all', async () => {
        const mockCase = { id: 1, suite_id: 10 };
        const mockUpdated = [{ id: 1, title: 'Updated' }, { id: 2, title: 'Updated' }];

        mockAxiosInstance.get.mockResolvedValue({ data: mockCase });
        mockAxiosInstance.post.mockResolvedValue({ data: { updated_cases: mockUpdated } });

        const result = await client.updateCases([1, 2], { title: 'Updated' });
        expect(result).toEqual(mockUpdated);
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/index.php?/api/v2/get_case/1');
        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
            '/index.php?/api/v2/update_cases/10',
            { case_ids: [1, 2], title: 'Updated' }
        );
    });

    test('createCase sends POST request', async () => {
        const mockData = { id: 1, title: 'New Case' };
        mockAxiosInstance.post.mockResolvedValue({ data: mockData });

        const result = await client.createCase('5', { title: 'New Case' });
        expect(result).toEqual(mockData);
        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
            '/index.php?/api/v2/add_case/5',
            { title: 'New Case' }
        );
    });

    test('getSections returns sections array', async () => {
        const mockSections = [{ id: 1, name: 'Section 1' }, { id: 2, name: 'Section 2' }];
        mockAxiosInstance.get.mockResolvedValue({ data: { sections: mockSections } });

        const result = await client.getSections('1');
        expect(result).toEqual(mockSections);
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/index.php?/api/v2/get_sections/1');
    });

    test('getProjects returns projects array', async () => {
        const mockProjects = [{ id: 1, name: 'Project 1' }];
        mockAxiosInstance.get.mockResolvedValue({ data: { projects: mockProjects } });

        const result = await client.getProjects();
        expect(result).toEqual(mockProjects);
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/index.php?/api/v2/get_projects');
    });

    test('getProjects caches result', async () => {
        const mockProjects = [{ id: 1, name: 'Project 1' }];
        mockAxiosInstance.get.mockResolvedValue({ data: { projects: mockProjects } });

        await client.getProjects();
        await client.getProjects();

        expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
    });

    test('postRequest throws formatted error on API error', async () => {
        const mockError = {
            message: 'Request failed',
            response: {
                status: 400,
                statusText: 'Bad Request',
                data: { error: 'Invalid field' }
            },
            isAxiosError: true,
            toJSON: () => ({})
        };

        mockAxiosInstance.post.mockRejectedValue(mockError);

        await expect(client.updateCase('1', {})).rejects.toThrow(
            'TestRail API error: 400 Bad Request - {"error":"Invalid field"}'
        );
    });

    test('handleError formats error when no response received', async () => {
        const mockError = {
            message: 'Network Error',
            request: {},
            isAxiosError: true,
            toJSON: () => ({})
        };

        mockAxiosInstance.get.mockRejectedValue(mockError);

        await expect(client.getCase('1')).rejects.toThrow(
            'TestRail API error: No response received. Network Error'
        );
    });

    test('handleError returns generic message for non-axios errors', async () => {
        const mockError = new Error('Unknown error');
        mockAxiosInstance.get.mockRejectedValue(mockError);

        await expect(client.getCase('1')).rejects.toThrow(
            'TestRail API error: Unknown error'
        );
    });
});
