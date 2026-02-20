import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { TestRailClient } from '../../src/client/testrail.js';
import { Section, Case } from '../../src/types/testrail.js';
import * as fs from 'fs';

describe('TestRailClient', () => {
    let client: TestRailClient;
    let fetchMock: any;

    beforeEach(() => {
        fetchMock = jest.spyOn(global, 'fetch');
        client = new TestRailClient('https://testrail.io/', 'user', 'apikey');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('constructor cleans trailing slash from baseUrl', async () => {
        const mockData = { id: 1, title: 'Test Case', template_id: 1 };
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => mockData
        });

        await client.getCase('1');

        expect(fetchMock).toHaveBeenCalledWith('https://testrail.io/index.php?/api/v2/get_case/1', expect.any(Object));
    });

    test('getCase returns data on success', async () => {
        const mockData = { id: 1, title: 'Test Case', template_id: 1 };
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => mockData
        });

        const result = await client.getCase('1');
        expect(result).toEqual(mockData);
        expect(fetchMock).toHaveBeenCalledWith('https://testrail.io/index.php?/api/v2/get_case/1', expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
                'Authorization': expect.stringContaining('Basic'),
                'Content-Type': 'application/json'
            })
        }));
    });

    test('getCase throws formatted error on API error', async () => {
        const errorResponse = { error: 'Case not found' };
        fetchMock.mockResolvedValue({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            text: async () => JSON.stringify(errorResponse),
            json: async () => errorResponse
        });

        await expect(client.getCase('999')).rejects.toThrow(
            'TestRail: 404 Not Found - {"error":"Case not found"}'
        );
    });

    test('getCase throws error containing raw text when response is not JSON', async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            text: async () => 'Not JSON Content',
            json: async () => { throw new Error('Not JSON'); }
        });

        await expect(client.getCase('1')).rejects.toThrow(
            'TestRail: 500 Internal Server Error - Not JSON Content'
        );
    });

    test('getCases returns cases without pagination', async () => {
        const mockCases = [{ id: 1, title: 'Case 1' }, { id: 2, title: 'Case 2' }];
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ cases: mockCases, _links: { next: null } })
        });

        const result = await client.getCases('1');
        expect(result).toEqual(mockCases);
        expect(fetchMock).toHaveBeenCalledWith(
            'https://testrail.io/index.php?/api/v2/get_cases/1',
            expect.objectContaining({ method: 'GET' })
        );
    });

    test('getCases handles response with undefined _links', async () => {
        const mockCases = [{ id: 1, title: 'Case 1' }];
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ cases: mockCases })
        });

        const result = await client.getCases('1');
        expect(result).toEqual(mockCases);
    });

    test('getCases handles pagination', async () => {
        const page1Cases = [{ id: 1, title: 'Case 1' }];
        const page2Cases = [{ id: 2, title: 'Case 2' }];

        fetchMock
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ cases: page1Cases, _links: { next: '/api/v2/get_cases/1&offset=1' } })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ cases: page2Cases, _links: { next: null } })
            });

        const result = await client.getCases('1');
        expect(result).toEqual([...page1Cases, ...page2Cases]);
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(fetchMock).toHaveBeenCalledWith(
            'https://testrail.io/index.php?/api/v2/get_cases/1',
            expect.any(Object)
        );
        expect(fetchMock).toHaveBeenCalledWith(
            'https://testrail.io/index.php?/api/v2/get_cases/1&offset=1',
            expect.any(Object)
        );
    });

    test('getCases with sectionId adds section filter', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ cases: [], _links: { next: null } })
        });

        await client.getCases('1', '5');
        expect(fetchMock).toHaveBeenCalledWith(
            'https://testrail.io/index.php?/api/v2/get_cases/1&section_id=5',
            expect.any(Object)
        );
    });

    test('getCases with filter adds query params', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ cases: [], _links: { next: null } })
        });

        await client.getCases('1', undefined, { type_id: '1', priority_id: '2' });
        expect(fetchMock).toHaveBeenCalledWith(
            'https://testrail.io/index.php?/api/v2/get_cases/1&type_id=1&priority_id=2',
            expect.any(Object)
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
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => mockData
        });

        const result = await client.getSection('1');
        expect(result).toEqual(mockData);
        expect(fetchMock).toHaveBeenCalledWith(
            'https://testrail.io/index.php?/api/v2/get_section/1',
            expect.any(Object)
        );
    });

    test('getPriorities returns data on success', async () => {
        const mockData = [{
            id: 1,
            is_default: true,
            name: 'Low',
            priority: 1,
            short_name: 'Low'
        }];
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => mockData
        });

        const result = await client.getPriorities();
        expect(result).toEqual(mockData);
        expect(fetchMock).toHaveBeenCalledWith(
            'https://testrail.io/index.php?/api/v2/get_priorities',
            expect.any(Object)
        );
    });

    test('getPriorities caches result', async () => {
        const mockData = [{ id: 1, name: 'Low' }];
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => mockData
        });

        await client.getPriorities();
        await client.getPriorities();

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    test('getCaseTypes returns data on success', async () => {
        const mockData = [{
            id: 1,
            is_default: true,
            name: 'Automated'
        }];
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => mockData
        });

        const result = await client.getCaseTypes();
        expect(result).toEqual(mockData);
        expect(fetchMock).toHaveBeenCalledWith(
            'https://testrail.io/index.php?/api/v2/get_case_types',
            expect.any(Object)
        );
    });

    test('getCaseFields returns data on success', async () => {
        const mockData = [{
            id: 1,
            name: 'custom_field',
            system_name: 'custom_field',
            label: 'Custom Field',
            type_id: 1
        }];
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => mockData
        });

        const result = await client.getCaseFields();
        expect(result).toEqual(mockData);
        expect(fetchMock).toHaveBeenCalledWith(
            'https://testrail.io/index.php?/api/v2/get_case_fields',
            expect.any(Object)
        );
    });

    test('getCaseFields caches result', async () => {
        const mockData = [{ id: 1, name: 'field' }];
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => mockData
        });

        await client.getCaseFields();
        await client.getCaseFields();

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    test('getTemplates returns data on success', async () => {
        const mockData = [{ id: 1, name: 'Test Template', is_default: true }];
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => mockData
        });

        const result = await client.getTemplates('1');
        expect(result).toEqual(mockData);
        expect(fetchMock).toHaveBeenCalledWith(
            'https://testrail.io/index.php?/api/v2/get_templates/1',
            expect.any(Object)
        );
    });

    test('getTemplates caches result per project', async () => {
        const mockData1 = [{ id: 1, name: 'Template 1' }];
        const mockData2 = [{ id: 2, name: 'Template 2' }];
        fetchMock
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockData1
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockData2
            });

        await client.getTemplates('1');
        await client.getTemplates('1');
        await client.getTemplates('2');

        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    test('updateCase sends POST request', async () => {
        const mockData = { id: 1, title: 'Updated Case' };
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => mockData
        });

        const result = await client.updateCase('1', { title: 'Updated Case' });
        expect(result).toEqual(mockData);
        expect(fetchMock).toHaveBeenCalledWith(
            'https://testrail.io/index.php?/api/v2/update_case/1',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ title: 'Updated Case' })
            })
        );
    });

    test('updateCases uses passed suiteId', async () => {
        const mockUpdated = [{ id: 1, title: 'Updated' }, { id: 2, title: 'Updated' }];

        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ updated_cases: mockUpdated })
        });

        const result = await client.updateCases(10, [1, 2], { title: 'Updated' });
        expect(result).toEqual(mockUpdated);
        expect(fetchMock).toHaveBeenCalledWith(
            'https://testrail.io/index.php?/api/v2/update_cases/10',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ case_ids: [1, 2], title: 'Updated' })
            })
        );
    });

    test('createCase sends POST request', async () => {
        const mockData = { id: 1, title: 'New Case' };
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => mockData
        });

        const result = await client.createCase('5', { title: 'New Case' });
        expect(result).toEqual(mockData);
        expect(fetchMock).toHaveBeenCalledWith(
            'https://testrail.io/index.php?/api/v2/add_case/5',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ title: 'New Case' })
            })
        );
    });

    test('getSections returns sections array', async () => {
        const mockSections = [{ id: 1, name: 'Section 1' }, { id: 2, name: 'Section 2' }];
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ sections: mockSections })
        });

        const result = await client.getSections('1');
        expect(result).toEqual(mockSections);
        expect(fetchMock).toHaveBeenCalledWith(
            'https://testrail.io/index.php?/api/v2/get_sections/1',
            expect.any(Object)
        );
    });

    test('getProjects returns projects array', async () => {
        const mockProjects = [{ id: 1, name: 'Project 1' }];
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ projects: mockProjects })
        });

        const result = await client.getProjects();
        expect(result).toEqual(mockProjects);
        expect(fetchMock).toHaveBeenCalledWith(
            'https://testrail.io/index.php?/api/v2/get_projects',
            expect.any(Object)
        );
    });

    test('getProjects caches result', async () => {
        const mockProjects = [{ id: 1, name: 'Project 1' }];
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ projects: mockProjects })
        });

        await client.getProjects();
        await client.getProjects();

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    test('postRequest throws formatted error on API error', async () => {
        const errorResponse = { error: 'Invalid field' };
        fetchMock.mockResolvedValue({
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            text: async () => JSON.stringify(errorResponse),
            json: async () => errorResponse
        });

        await expect(client.updateCase('1', {})).rejects.toThrow(
            'TestRail: 400 Bad Request - {"error":"Invalid field"}'
        );
    });

    test('addRun posts fields directly', async () => {
        const mockRun = { id: 1, name: 'New Run' };

        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => mockRun
        });

        const result = await client.addRun('1', { name: 'New Run', suite_id: 20 });

        expect(result).toEqual(mockRun);
        expect(fetchMock).toHaveBeenCalledWith(
            'https://testrail.io/index.php?/api/v2/add_run/1',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ name: 'New Run', suite_id: 20 })
            })
        );
    });

    test('getTests handles pagination', async () => {
        fetchMock
            .mockImplementationOnce(() => Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    tests: [{ id: 1, case_id: 1, status_id: 1, title: 'Test 1', run_id: 1 }],
                    _links: { next: '/api/v2/get_tests/1&offset=1' }
                }),
            } as Response))
            .mockImplementationOnce(() => Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    tests: [{ id: 2, case_id: 2, status_id: 1, title: 'Test 2', run_id: 1 }],
                    _links: { next: null }
                }),
            } as Response));

        const tests = await client.getTests(1);
        expect(tests).toHaveLength(2);
        expect(tests[0].id).toBe(1);
        expect(tests[1].id).toBe(2);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    test('getTests with status_id adds filter', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                tests: [],
                _links: { next: null }
            })
        } as Response);

        await client.getTests(1, [1, 5]);

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/get_tests/1&status_id=1,5'),
            expect.any(Object)
        );
    });

    test('getStatuses caches result', async () => {
        const mockStatuses = [{ id: 1, name: 'passed', label: 'Passed' }];
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => mockStatuses
        });

        await client.getStatuses();
        await client.getStatuses();

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    test('addResults posts results array', async () => {
        const mockResults = [
            { id: 1, test_id: 100, status_id: 1, comment: 'Passed', defects: null },
            { id: 2, test_id: 101, status_id: 5, comment: 'Failed', defects: 'BUG-123' }
        ];

        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => mockResults
        });

        const results = await client.addResults(50, [
            { test_id: 100, status_id: 1, comment: 'Passed' },
            { test_id: 101, status_id: 5, comment: 'Failed', defects: 'BUG-123' }
        ]);

        expect(results).toEqual(mockResults);
        expect(fetchMock).toHaveBeenCalledWith(
            'https://testrail.io/index.php?/api/v2/add_results/50',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    results: [
                        { test_id: 100, status_id: 1, comment: 'Passed' },
                        { test_id: 101, status_id: 5, comment: 'Failed', defects: 'BUG-123' }
                    ]
                })
            })
        );
    });

    test('addAttachmentToRun uploads file using FormData', async () => {
        const mockAttachment = { attachment_id: 443 };
        const mockFileBuffer = Buffer.from('file content');

        jest.spyOn(fs.promises, 'readFile').mockResolvedValue(mockFileBuffer);

        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => mockAttachment
        });

        const result = await client.addAttachmentToRun(100, '/path/to/file.txt', 'file.txt');

        expect(result).toEqual(mockAttachment);
        expect(fs.promises.readFile).toHaveBeenCalledWith('/path/to/file.txt');
        expect(fetchMock).toHaveBeenCalledWith(
            'https://testrail.io/index.php?/api/v2/add_attachment_to_run/100',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'Authorization': expect.stringContaining('Basic')
                }),
                body: expect.any(FormData)
            })
        );
    });

    test('getCasesRecursively fetches cases from section and all subsections', async () => {
        // Mock Section Tree:
        // Section 1 (Root target)
        // ├── Section 2
        // │   └── Section 3
        // └── Section 4
        // Section 5 (Outside target)

        const mockSections: Section[] = [
            { id: 1, name: 'Root', parent_id: null, suite_id: 1, description: '' },
            { id: 2, name: 'Child 1', parent_id: 1, suite_id: 1, description: '' },
            { id: 3, name: 'Grandchild', parent_id: 2, suite_id: 1, description: '' },
            { id: 4, name: 'Child 2', parent_id: 1, suite_id: 1, description: '' },
            { id: 5, name: 'Other', parent_id: null, suite_id: 1, description: '' },
        ];

        // Mock Cases
        const casesSection1: Case[] = [{ id: 101, title: 'Case S1', section_id: 1, suite_id: 1 } as Case];
        const casesSection2: Case[] = [{ id: 102, title: 'Case S2', section_id: 2, suite_id: 1 } as Case];
        const casesSection3: Case[] = [{ id: 103, title: 'Case S3', section_id: 3, suite_id: 1 } as Case];
        const casesSection4: Case[] = [];
        const casesSection5: Case[] = [{ id: 105, title: 'Case S5', section_id: 5, suite_id: 1 } as Case];

        // Setup Mocks
        // 1. getSections call
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ sections: mockSections })
        });

        // 2. getCases calls (order might vary depending on Promise.all implementation, so we match by URL)
        fetchMock.mockImplementation((url: string) => {
            if (url.includes('/get_sections/1')) { // fallback if calls happen differently
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ sections: mockSections })
                });
            }
            if (url.includes('section_id=1')) return Promise.resolve({ ok: true, json: async () => ({ cases: casesSection1, _links: {} }) });
            if (url.includes('section_id=2')) return Promise.resolve({ ok: true, json: async () => ({ cases: casesSection2, _links: {} }) });
            if (url.includes('section_id=3')) return Promise.resolve({ ok: true, json: async () => ({ cases: casesSection3, _links: {} }) });
            if (url.includes('section_id=4')) return Promise.resolve({ ok: true, json: async () => ({ cases: casesSection4, _links: {} }) });

            return Promise.reject(new Error(`Unexpected URL: ${url}`));
        });

        const result = await client.getCasesRecursively('1', '1');

        // Check if we got cases from sections 1, 2, 3, 4
        const resultIds = result.map(c => c.id).sort();
        expect(resultIds).toEqual([101, 102, 103]);

        // Check that Section 5 was NOT fetched
        expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('section_id=5'), expect.anything());
    });

    test('getCasesRecursively passes filter to getCases', async () => {
        const mockSections: Section[] = [
            { id: 1, name: 'Root', parent_id: null, suite_id: 1, description: '' },
            { id: 2, name: 'Child', parent_id: 1, suite_id: 1, description: '' },
        ];

        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ sections: mockSections })
        });

        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ cases: [], _links: {} })
        });

        await client.getCasesRecursively('1', '1', { priority_id: '1' });

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('section_id=1&priority_id=1'),
            expect.anything()
        );
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('section_id=2&priority_id=1'),
            expect.anything()
        );
    });

    test('getCasesRecursively excludes sections by name', async () => {
        // Mock Section Tree:
        // Section 1 (Root)
        // ├── Section 2 (To keep)
        // ├── Section 3 (To exclude)
        // │    └── Section 4 (Should be excluded via parent)
        // └── Section 5 (To keep)

        const mockSections: Section[] = [
            { id: 1, name: 'Root', parent_id: null, suite_id: 1, description: '' },
            { id: 2, name: 'Keep 1', parent_id: 1, suite_id: 1, description: '' },
            { id: 3, name: 'Exclude Me', parent_id: 1, suite_id: 1, description: '' },
            { id: 4, name: 'Child of Excluded', parent_id: 3, suite_id: 1, description: '' },
            { id: 5, name: 'Keep 2', parent_id: 1, suite_id: 1, description: '' },
        ];

        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ sections: mockSections })
        });

        // Mock empty cases for simplicity, we just want to verify calls
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ cases: [], _links: {} })
        });

        await client.getCasesRecursively('1', '1', undefined, ['Exclude Me']);

        // Should fetch for Root (1), Keep 1 (2), Keep 2 (5)
        expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('section_id=1'), expect.anything());
        expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('section_id=2'), expect.anything());
        expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('section_id=5'), expect.anything());

        // Should NOT fetch for Exclude Me (3) or Child of Excluded (4)
        expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('section_id=3'), expect.anything());
        expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('section_id=4'), expect.anything());
    });
});
