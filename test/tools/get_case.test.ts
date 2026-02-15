import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { getCaseTool } from '../../src/tools/get_case.js';
import { TestRailClient } from '../../src/client/testrail.js';
import { Case, Section, CaseType, Priority, CaseField } from '../../src/types/testrail.js';

describe('get_case tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let getCaseMock: jest.Mock<(id: string) => Promise<Case>>;
    let getSectionMock: jest.Mock<(id: string) => Promise<Section>>;
    let getCaseTypesMock: jest.Mock<() => Promise<CaseType[]>>;
    let getPrioritiesMock: jest.Mock<() => Promise<Priority[]>>;
    let getCaseFieldsMock: jest.Mock<() => Promise<CaseField[]>>;

    const mockCaseFields: CaseField[] = [
        { id: 1, name: 'is_automated', system_name: 'custom_is_automated', label: 'Is Automated', type_id: 1, template_ids: [], include_all: true, is_active: true, description: null, configs: [] },
        { id: 2, name: 'refs', system_name: 'custom_refs', label: 'Defects', type_id: 1, template_ids: [], include_all: true, is_active: true, description: null, configs: [] },
        { id: 3, name: 'case_automation_priority', system_name: 'custom_case_automation_priority', label: 'Automation Priority', type_id: 6, template_ids: [], include_all: true, is_active: true, description: null, configs: [{ options: { items: '2, P0\n3, P1\n4, P2\n5, P3\n6, P4' } }] },
        { id: 4, name: 'preconds', system_name: 'custom_preconds', label: 'Preconditions', type_id: 1, template_ids: [], include_all: true, is_active: true, description: null, configs: [] },
        { id: 5, name: 'steps', system_name: 'custom_steps', label: 'Steps', type_id: 1, template_ids: [1], include_all: false, is_active: true, description: null, configs: [] },
        { id: 6, name: 'expected', system_name: 'custom_expected', label: 'Expected', type_id: 1, template_ids: [1], include_all: false, is_active: true, description: null, configs: [] },
        { id: 7, name: 'steps_separated', system_name: 'custom_steps_separated', label: 'Steps Separated', type_id: 1, template_ids: [2], include_all: false, is_active: true, description: null, configs: [] },
    ];

    beforeEach(() => {
        getCaseMock = jest.fn<(id: string) => Promise<Case>>();
        getSectionMock = jest.fn<(id: string) => Promise<Section>>();
        getCaseTypesMock = jest.fn<() => Promise<CaseType[]>>();
        getPrioritiesMock = jest.fn<() => Promise<Priority[]>>();
        getCaseFieldsMock = jest.fn<() => Promise<CaseField[]>>().mockResolvedValue(mockCaseFields);

        mockClient = {
            getCase: getCaseMock,
            getSection: getSectionMock,
            getCaseTypes: getCaseTypesMock,
            getPriorities: getPrioritiesMock,
            getCaseFields: getCaseFieldsMock
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('exports correct tool definition', () => {
        expect(getCaseTool.name).toBe('get_case');
        expect(getCaseTool.description).toBe('Get detailed information about a test case including its custom fields');
        expect(getCaseTool.parameters).toBeDefined();
    });

    test('handler fetches data and returns transformed response', async () => {
        const mockCase: Case = {
            id: 123, title: 'My Case', template_id: 1,
            section_id: 456,
            type_id: 2,
            priority_id: 3,
            milestone_id: null,
            refs: 'JIRA-123',
            created_on: 1700000000,
            updated_on: 1700000000,
            estimate: null,
            suite_id: 1,
            custom_refs: null,
            custom_case_automation_priority: null,
            custom_is_automated: null,
            custom_reviewer: null,
            custom_review_status: null,
            custom_testrail_bdd_scenario: null,
            custom_override: null,
            custom_preconds: null,
            custom_steps: null,
            custom_expected: null,
            custom_steps_separated: null,
            custom_mission: null,
            custom_goals: null,
            custom_postcondition: null,
            custom_comments: null,
            labels: ['tag1']
        };

        const mockSection: Section = {
            id: 456, name: 'My Section', description: null, parent_id: null, suite_id: 1
        };

        const mockCaseTypes: CaseType[] = [
            { id: 1, name: 'Automated', is_default: false },
            { id: 2, name: 'Functional', is_default: true }
        ];

        const mockPriorities: Priority[] = [
            { id: 3, name: 'High', is_default: false }
        ];

        getCaseMock.mockResolvedValue(mockCase);
        getSectionMock.mockResolvedValue(mockSection);
        getCaseTypesMock.mockResolvedValue(mockCaseTypes);
        getPrioritiesMock.mockResolvedValue(mockPriorities);

        const result = await getCaseTool.handler({ case_id: 'C123' }, mockClient);

        expect(result).toBeDefined();
        expect(result).toEqual({
            id: 123,
            title: 'My Case',
            section: 'My Section',
            type: 'Functional',
            priority: 'High',
            labels: ['tag1'],
            references: 'JIRA-123',
            updated_on: 1700000000
        });

        expect(mockClient.getCase).toHaveBeenCalledWith('123');
        expect(mockClient.getSection).toHaveBeenCalledWith('456');
        expect(mockClient.getCaseTypes).toHaveBeenCalled();
        expect(mockClient.getPriorities).toHaveBeenCalled();
    });



    test('handler throws error on failure', async () => {
        getCaseMock.mockRejectedValue(new Error('API Error'));

        await expect(
            getCaseTool.handler({ case_id: '123' }, mockClient)
        ).rejects.toThrow('API Error');
    });

    test('handler returns "Unknown" when caseType is not found', async () => {
        const mockCase: Case = {
            id: 123, title: 'My Case', template_id: 1,
            section_id: 456, type_id: 999, priority_id: 3,
            milestone_id: null, refs: null, created_on: 1700000000,
            updated_on: 1700000000, estimate: null,
            suite_id: 1, labels: []
        };

        getCaseMock.mockResolvedValue(mockCase);
        getSectionMock.mockResolvedValue({ id: 456, name: 'Section', description: null, parent_id: null, suite_id: 1 });
        getCaseTypesMock.mockResolvedValue([{ id: 1, name: 'Automated', is_default: false }]);
        getPrioritiesMock.mockResolvedValue([{ id: 3, name: 'High', is_default: false }]);

        const result = await getCaseTool.handler({ case_id: '123' }, mockClient);
        // result is now a plain object

        expect(result.type).toBe('Unknown');
        expect(result.priority).toBe('High');
    });

    test('handler returns "Unknown" when priority is not found', async () => {
        const mockCase: Case = {
            id: 123, title: 'My Case', template_id: 1,
            section_id: 456, type_id: 1, priority_id: 999,
            milestone_id: null, refs: null, created_on: 1700000000,
            updated_on: 1700000000, estimate: null,
            suite_id: 1, labels: []
        };

        getCaseMock.mockResolvedValue(mockCase);
        getSectionMock.mockResolvedValue({ id: 456, name: 'Section', description: null, parent_id: null, suite_id: 1 });
        getCaseTypesMock.mockResolvedValue([{ id: 1, name: 'Automated', is_default: false }]);
        getPrioritiesMock.mockResolvedValue([{ id: 3, name: 'High', is_default: false }]);

        const result = await getCaseTool.handler({ case_id: '123' }, mockClient);
        // result is now a plain object

        expect(result.type).toBe('Automated');
        expect(result.priority).toBe('Unknown');
    });

    test('handler uses empty array when labels is undefined', async () => {
        const mockCase: Case = {
            id: 123, title: 'My Case', template_id: 1,
            section_id: 456, type_id: 1, priority_id: 3,
            milestone_id: null, refs: null, created_on: 1700000000,
            updated_on: 1700000000, estimate: null,
            suite_id: 1, labels: undefined as any
        };

        getCaseMock.mockResolvedValue(mockCase);
        getSectionMock.mockResolvedValue({ id: 456, name: 'Section', description: null, parent_id: null, suite_id: 1 });
        getCaseTypesMock.mockResolvedValue([{ id: 1, name: 'Automated', is_default: false }]);
        getPrioritiesMock.mockResolvedValue([{ id: 3, name: 'High', is_default: false }]);

        const result = await getCaseTool.handler({ case_id: '123' }, mockClient);
        // result is now a plain object

        expect(result.labels).toEqual([]);
    });
});
