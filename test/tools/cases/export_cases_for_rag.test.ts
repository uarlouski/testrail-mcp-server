import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exportCasesForRagTool } from '../../../src/tools/cases/export_cases_for_rag.js';
import { TestRailClient } from '../../../src/client/testrail.js';
import { Case, CaseField } from '../../../src/tools/cases/types.js';
import { Section } from '../../../src/tools/sections/types.js';
import { CaseType, Priority } from '../../../src/types/testrail.js';

describe('export_cases_for_rag tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let getCaseMock: jest.Mock<(id: number) => Promise<Case>>;
    let getSectionMock: jest.Mock<(id: number) => Promise<Section>>;
    let getCaseTypesMock: jest.Mock<() => Promise<CaseType[]>>;
    let getPrioritiesMock: jest.Mock<() => Promise<Priority[]>>;
    let getCaseFieldsMock: jest.Mock<() => Promise<CaseField[]>>;
    let tempDirs: string[] = [];

    const mockCaseFields: CaseField[] = [
        { id: 1, name: 'preconds', system_name: 'custom_preconds', label: 'Preconditions', type_id: 3, template_ids: [], include_all: true, is_active: true, description: null, configs: [] },
        { id: 2, name: 'steps_separated', system_name: 'custom_steps_separated', label: 'Steps & Expected Results', type_id: 10, template_ids: [], include_all: true, is_active: true, description: null, configs: [] },
        { id: 3, name: 'steps', system_name: 'custom_steps', label: 'Steps', type_id: 3, template_ids: [], include_all: true, is_active: true, description: null, configs: [] },
        { id: 4, name: 'expected', system_name: 'custom_expected', label: 'Expected Results', type_id: 3, template_ids: [], include_all: true, is_active: true, description: null, configs: [] },
        { id: 5, name: 'automation_type', system_name: 'custom_automation_type', label: 'Automation Type', type_id: 6, template_ids: [], include_all: true, is_active: true, description: null, configs: [{ options: { items: '1, None\n2, Automated\n3, Needs Review' } }] },
        { id: 6, name: 'test_notes', system_name: 'custom_test_notes', label: 'Test Notes', type_id: 3, template_ids: [], include_all: true, is_active: true, description: null, configs: [] },
    ];

    beforeEach(() => {
        getCaseMock = jest.fn<(id: number) => Promise<Case>>();
        getSectionMock = jest.fn<(id: number) => Promise<Section>>();
        getCaseTypesMock = jest.fn<() => Promise<CaseType[]>>().mockResolvedValue([
            { id: 1, name: 'Automated', is_default: false },
            { id: 2, name: 'Functional', is_default: true },
        ]);
        getPrioritiesMock = jest.fn<() => Promise<Priority[]>>().mockResolvedValue([
            { id: 1, name: 'Low', short_name: 'L', priority: 1, is_default: false },
            { id: 2, name: 'High', short_name: 'H', priority: 2, is_default: false },
        ]);
        getCaseFieldsMock = jest.fn<() => Promise<CaseField[]>>().mockResolvedValue(mockCaseFields);

        mockClient = {
            getCase: getCaseMock,
            getSection: getSectionMock,
            getCaseTypes: getCaseTypesMock,
            getPriorities: getPrioritiesMock,
            getCaseFields: getCaseFieldsMock,
        } as unknown as jest.Mocked<TestRailClient>;
    });

    afterEach(async () => {
        for (const dir of tempDirs) {
            try {
                await fs.promises.rm(dir, { recursive: true, force: true });
            } catch {
                // Ignore cleanup errors
            }
        }
        tempDirs = [];
    });

    test('exports correct tool definition', () => {
        expect(exportCasesForRagTool.name).toBe('export_cases_for_rag');
        expect(exportCasesForRagTool.mode).toBe('read');
        expect(exportCasesForRagTool.parameters).toBeDefined();
    });

    test('exports single case with separated steps to custom output_dir', async () => {
        const testTempDir = path.join(os.tmpdir(), `rag_test_${Date.now()}`);
        tempDirs.push(testTempDir);

        const mockCase: Case = {
            id: 101,
            title: 'Verify User Login with Valid Credentials',
            section_id: 20,
            template_id: 2,
            type_id: 2,
            priority_id: 2,
            milestone_id: null,
            refs: 'AUTH-101',
            created_on: 1700000000,
            updated_on: 1700005000,
            estimate: null,
            suite_id: 1,
            labels: [],
            custom_preconds: 'User must have an active registered account.',
            custom_steps_separated: [
                {
                    content: 'Navigate to login page',
                    expected: 'Login form is displayed',
                },
                {
                    content: 'Enter email and password and click submit',
                    expected: 'User is redirected to Dashboard',
                    additional_info: 'Use test account creds',
                },
            ],
            custom_automation_type: 2,
        };

        getCaseMock.mockResolvedValue(mockCase);
        getSectionMock.mockResolvedValue({ id: 20, name: 'Authentication Suite', description: '', suite_id: 1, parent_id: null, depth: 0, display_order: 1 });

        const result = await exportCasesForRagTool.handler(
            {
                case_ids: ['C101'],
                output_dir: testTempDir,
            },
            mockClient
        );

        expect(result.success).toBe(true);
        expect(result.exported_count).toBe(1);
        expect(result.output_dir).toBe(testTempDir);
        expect(result.files).toEqual(['C101.md', 'C101.md.metadata.json']);

        // Check Markdown content
        const mdPath = path.join(testTempDir, 'C101.md');
        expect(fs.existsSync(mdPath)).toBe(true);
        const mdContent = await fs.promises.readFile(mdPath, 'utf-8');
        expect(mdContent).toContain('# [C101] Verify User Login with Valid Credentials');
        expect(mdContent).toContain('**Section**: Authentication Suite');
        expect(mdContent).not.toContain('**Type**');
        expect(mdContent).not.toContain('**Priority**');
        expect(mdContent).toContain('## Preconditions');
        expect(mdContent).toContain('User must have an active registered account.');
        expect(mdContent).toContain('## Steps & Expected Results');
        expect(mdContent).toContain('1. **Action**: Navigate to login page');
        expect(mdContent).toContain('   - **Expected**: Login form is displayed');
        expect(mdContent).toContain('2. **Action**: Enter email and password and click submit');
        expect(mdContent).toContain('   - **Info**: Use test account creds');
        expect(mdContent).toContain('   - **Expected**: User is redirected to Dashboard');

        // Check Metadata JSON content
        const metaPath = path.join(testTempDir, 'C101.md.metadata.json');
        expect(fs.existsSync(metaPath)).toBe(true);
        const metaContent = JSON.parse(await fs.promises.readFile(metaPath, 'utf-8'));
        expect(metaContent).toEqual({
            metadataAttributes: {
                case_id: 101,
                title: 'Verify User Login with Valid Credentials',
                section: 'Authentication Suite',
                priority: 'High',
                references: 'AUTH-101',
                automation_type: 'Automated',
            },
        });
    });

    test('exports multiple cases', async () => {
        const testTempDir = path.join(os.tmpdir(), `rag_test_multi_${Date.now()}`);
        tempDirs.push(testTempDir);

        const mockCase1: Case = {
            id: 201,
            title: 'Cart Total Calculation',
            section_id: 30,
            template_id: 1,
            type_id: 1,
            priority_id: 1,
            milestone_id: null,
            refs: null,
            created_on: 1700000000,
            updated_on: 1700006000,
            estimate: null,
            suite_id: 1,
            labels: [],
            custom_steps: '1. Add 2 items to cart\n2. View cart',
            custom_expected: 'Total equals sum of prices',
            custom_test_notes: 'Requires tax rates enabled',
        };

        const mockCase2: Case = {
            id: 202,
            title: 'Empty Cart Checkout',
            section_id: 30,
            template_id: 1,
            type_id: 1,
            priority_id: 1,
            milestone_id: null,
            refs: null,
            created_on: 1700000000,
            updated_on: 1700007000,
            estimate: null,
            suite_id: 1,
            labels: [],
            custom_steps: 'Click checkout when cart is empty',
            custom_expected: 'Shows empty cart warning',
        };

        getCaseMock.mockImplementation(async (id: number) => {
            if (id === 201) return mockCase1;
            if (id === 202) return mockCase2;
            throw new Error('Case not found');
        });

        getSectionMock.mockResolvedValue({ id: 30, name: 'Cart & Checkout', description: '', suite_id: 1, parent_id: null, depth: 0, display_order: 1 });

        const result = await exportCasesForRagTool.handler(
            {
                case_ids: [201, 202],
                output_dir: testTempDir,
            },
            mockClient
        );

        expect(result.exported_count).toBe(2);
        expect(result.files.length).toBe(4);

        const md1 = await fs.promises.readFile(path.join(testTempDir, 'C201.md'), 'utf-8');
        expect(md1).toContain('# [C201] Cart Total Calculation');
        expect(md1).toContain('## Steps');
        expect(md1).toContain('## Expected Results');
        expect(md1).toContain('## Test Notes');
        expect(md1).toContain('Requires tax rates enabled');

        const md2 = await fs.promises.readFile(path.join(testTempDir, 'C202.md'), 'utf-8');
        expect(md2).toContain('# [C202] Empty Cart Checkout');
    });

    test('auto-generates output directory when output_dir is not provided', async () => {
        const mockCase: Case = {
            id: 301,
            title: 'Auto Directory Test',
            section_id: 10,
            template_id: 1,
            type_id: 2,
            priority_id: 2,
            milestone_id: null,
            refs: null,
            created_on: 1700000000,
            updated_on: 1700005000,
            estimate: null,
            suite_id: 1,
            labels: [],
        };

        getCaseMock.mockResolvedValue(mockCase);
        getSectionMock.mockResolvedValue({ id: 10, name: 'General', description: '', suite_id: 1, parent_id: null, depth: 0, display_order: 1 });

        const result = await exportCasesForRagTool.handler(
            {
                case_ids: [301],
            },
            mockClient
        );

        expect(result.success).toBe(true);
        expect(result.output_dir).toBeDefined();
        tempDirs.push(result.output_dir);
        expect(fs.existsSync(result.output_dir)).toBe(true);
        expect(fs.existsSync(path.join(result.output_dir, 'C301.md'))).toBe(true);
        expect(fs.existsSync(path.join(result.output_dir, 'C301.md.metadata.json'))).toBe(true);
    });

    test('handles missing section gracefully by using Unknown', async () => {
        const testTempDir = path.join(os.tmpdir(), `rag_test_err_${Date.now()}`);
        tempDirs.push(testTempDir);

        const mockCase: Case = {
            id: 401,
            title: 'Missing Section Test',
            section_id: null,
            template_id: 1,
            type_id: 2,
            priority_id: 2,
            milestone_id: null,
            refs: null,
            created_on: 1700000000,
            updated_on: 1700005000,
            estimate: null,
            suite_id: 1,
            labels: [],
        };

        getCaseMock.mockResolvedValue(mockCase);

        const result = await exportCasesForRagTool.handler(
            {
                case_ids: [401],
                output_dir: testTempDir,
            },
            mockClient
        );

        expect(result.success).toBe(true);
        const mdContent = await fs.promises.readFile(path.join(testTempDir, 'C401.md'), 'utf-8');
        expect(mdContent).toContain('**Section**: Unknown');
    });

    test('automatically routes custom fields by type when fields parameters are omitted', async () => {
        const testTempDir = path.join(os.tmpdir(), `rag_test_autoroute_${Date.now()}`);
        tempDirs.push(testTempDir);

        const mockCase: Case = {
            id: 501,
            title: 'Auto Routing Case',
            section_id: 10,
            template_id: 1,
            type_id: 2,
            priority_id: 2,
            milestone_id: null,
            refs: 'REF-501',
            created_on: 1700000000,
            updated_on: 1700005000,
            estimate: null,
            suite_id: 1,
            labels: [{ id: 1, title: 'Regression' }],
            custom_preconds: 'Precondition text',
            custom_steps: 'Step 1\nStep 2',
            custom_expected: 'Expected text',
            custom_automation_type: 2,
            custom_test_notes: 'Multiline notes:\n- Note 1\n- Note 2',
            custom_feature_tags: 'feat.checkout',
        };

        const extraCaseFields: CaseField[] = [
            ...mockCaseFields,
            { id: 5, name: 'feature_tags', system_name: 'custom_feature_tags', label: 'Feature Tags', type_id: 12, template_ids: [], include_all: true, is_active: true, description: null, configs: [{ options: { items: '1, feat.checkout\n2, feat.cart' } }] },
        ];
        getCaseFieldsMock.mockResolvedValue(extraCaseFields);
        getCaseMock.mockResolvedValue(mockCase);
        getSectionMock.mockResolvedValue({ id: 10, name: 'General', description: '', suite_id: 1, parent_id: null, depth: 0, display_order: 1 });

        const result = await exportCasesForRagTool.handler(
            {
                case_ids: [501],
                output_dir: testTempDir,
            },
            mockClient
        );

        expect(result.success).toBe(true);

        const mdContent = await fs.promises.readFile(path.join(testTempDir, 'C501.md'), 'utf-8');
        expect(mdContent).toContain('## Preconditions');
        expect(mdContent).toContain('## Steps');
        expect(mdContent).toContain('## Expected Results');
        expect(mdContent).toContain('## Test Notes'); // Multiline string auto-routed to Markdown
        expect(mdContent).toContain('- Note 1');

        const metaContent = JSON.parse(await fs.promises.readFile(path.join(testTempDir, 'C501.md.metadata.json'), 'utf-8'));
        expect(metaContent.metadataAttributes).toEqual({
            case_id: 501,
            title: 'Auto Routing Case',
            section: 'General',
            priority: 'High',
            references: 'REF-501',
            labels: ['Regression'],
            automation_type: 'Automated', // type 6 Dropdown auto-routed to metadata
            feature_tags: ['feat.checkout'], // type 12 Multi-select auto-routed to metadata as list of strings
        });
    });

    test('handles fallback when getPriorities and getCaseFields reject', async () => {
        const testTempDir = path.join(os.tmpdir(), `rag_test_fallback_${Date.now()}`);
        tempDirs.push(testTempDir);

        getPrioritiesMock.mockRejectedValue(new Error('Network error on priorities'));
        getCaseFieldsMock.mockRejectedValue(new Error('Network error on case fields'));

        const mockCase: Case = {
            id: 601,
            title: 'Fallback Case',
            section_id: 10,
            template_id: 1,
            type_id: 2,
            priority_id: 999, // Unknown priority ID
            milestone_id: null,
            refs: null,
            created_on: 1700000000,
            updated_on: 1700005000,
            estimate: null,
            suite_id: 1,
            labels: [{ id: 1, title: 'Manual' }, { id: 2, title: 'Smoke' }, { id: 3, title: 'Core' }],
            custom_single_line_unmapped: 'Single line value',
            custom_multi_line_unmapped: 'Line 1\nLine 2',
            custom_empty_field: '',
            custom_null_field: null,
            custom_undefined_field: undefined,
            custom_empty_array: [],
            custom_review_status: 'Ignored',
            custom_reviewer: 42,
            custom_created_by: 1,
            custom_updated_by: 1,
            custom_display_order: 10,
            custom_is_deleted: 0,
        } as any;

        getCaseMock.mockResolvedValue(mockCase);
        getSectionMock.mockResolvedValue({ id: 10, name: '' } as any); // Section without name

        const result = await exportCasesForRagTool.handler(
            {
                case_ids: [601],
                output_dir: testTempDir,
            },
            mockClient
        );

        expect(result.success).toBe(true);

        const mdContent = await fs.promises.readFile(path.join(testTempDir, 'C601.md'), 'utf-8');
        expect(mdContent).toContain('**Section**: Unknown');
        expect(mdContent).toContain('## Multi Line Unmapped');
        expect(mdContent).toContain('Line 1\nLine 2');
        expect(mdContent).not.toContain('## Single Line Unmapped');

        const metaContent = JSON.parse(await fs.promises.readFile(path.join(testTempDir, 'C601.md.metadata.json'), 'utf-8'));
        expect(metaContent.metadataAttributes.priority).toBe('Unknown');
        expect(metaContent.metadataAttributes.single_line_unmapped).toBe('Single line value');
        expect(metaContent.metadataAttributes.labels).toEqual(['Manual', 'Smoke', 'Core']);
        expect(metaContent.metadataAttributes.review_status).toBeUndefined();
        expect(metaContent.metadataAttributes.reviewer).toBeUndefined();
        expect(metaContent.metadataAttributes.created_by).toBeUndefined();
    });

    test('handles structured vs unstructured field definitions and complex arrays in metadata', async () => {
        const testTempDir = path.join(os.tmpdir(), `rag_test_complex_${Date.now()}`);
        tempDirs.push(testTempDir);

        const customFieldsSchema: CaseField[] = [
            { id: 1, name: 'string_single', system_name: 'custom_string_single', label: 'Single Line String', type_id: 1, template_ids: [], include_all: true, is_active: true, description: null, configs: [] },
            { id: 2, name: 'string_multi', system_name: 'custom_string_multi', label: 'Multi Line String', type_id: 1, template_ids: [], include_all: true, is_active: true, description: null, configs: [] },
            { id: 3, name: 'obj_array', system_name: 'custom_obj_array', label: 'Object Array', type_id: 6, template_ids: [], include_all: true, is_active: true, description: null, configs: [] },
            { id: 4, name: 'steps_field', system_name: 'custom_steps_field', label: 'Custom Steps Field', type_id: 10, template_ids: [], include_all: true, is_active: true, description: null, configs: [] },
        ];

        getCaseFieldsMock.mockResolvedValue(customFieldsSchema);

        const mockCase: Case = {
            id: 701,
            title: 'Complex Case',
            section_id: 10,
            template_id: 1,
            type_id: 1,
            priority_id: 1,
            milestone_id: null,
            refs: 'REF-701',
            created_on: 1700000000,
            updated_on: 1700005000,
            estimate: null,
            suite_id: 1,
            labels: [{ id: 99, title: 'Tag99' }],
            custom_string_single: 'Simple text',
            custom_string_multi: 'Line 1\nLine 2',
            custom_obj_array: [{ name: 'Item1' }, { label: 'Item2' }, { other: 123 }, 'simple'],
            custom_steps_field: [
                { content: 'Action without expected' },
                { content: '', expected: 'Expected without content' },
                { content: 'Action 3', expected: 'Expected 3', additional_info: 'Extra info' },
            ],
        } as any;

        getCaseMock.mockResolvedValue(mockCase);
        getSectionMock.mockResolvedValue({ id: 10, name: 'Section 10' } as any);

        const result = await exportCasesForRagTool.handler(
            {
                case_ids: [701],
                output_dir: testTempDir,
            },
            mockClient
        );

        expect(result.success).toBe(true);

        const mdContent = await fs.promises.readFile(path.join(testTempDir, 'C701.md'), 'utf-8');
        expect(mdContent).toContain('## Multi Line String');
        expect(mdContent).toContain('## Custom Steps Field');
        expect(mdContent).toContain('1. **Action**: Action without expected');
        expect(mdContent).toContain('2. **Action**: \n   - **Expected**: Expected without content');
        expect(mdContent).toContain('3. **Action**: Action 3\n   - **Info**: Extra info\n   - **Expected**: Expected 3');

        const metaContent = JSON.parse(await fs.promises.readFile(path.join(testTempDir, 'C701.md.metadata.json'), 'utf-8'));
        expect(metaContent.metadataAttributes.labels).toEqual(['Tag99']);
        expect(metaContent.metadataAttributes.single_line_string).toBe('Simple text');
        expect(metaContent.metadataAttributes.object_array).toEqual([
            'Item1',
            'Item2',
            JSON.stringify({ other: 123 }),
            'simple',
        ]);
    });

    test('handles empty steps separated list without error', async () => {
        const testTempDir = path.join(os.tmpdir(), `rag_test_empty_steps_${Date.now()}`);
        tempDirs.push(testTempDir);

        const customFieldsSchema: CaseField[] = [
            { id: 1, name: 'steps_field', system_name: 'custom_steps_field', label: 'Empty Steps Field', type_id: 10, template_ids: [], include_all: true, is_active: true, description: null, configs: [] },
        ];

        getCaseFieldsMock.mockResolvedValue(customFieldsSchema);

        const mockCase: Case = {
            id: 801,
            title: 'Empty Steps Case',
            section_id: 10,
            template_id: 1,
            type_id: 1,
            priority_id: 1,
            milestone_id: null,
            refs: null,
            created_on: 1700000000,
            updated_on: 1700005000,
            estimate: null,
            suite_id: 1,
            labels: [],
            custom_steps_field: [],
        } as any;

        getCaseMock.mockResolvedValue(mockCase);
        getSectionMock.mockResolvedValue({ id: 10, name: 'Section 10' } as any);

        const result = await exportCasesForRagTool.handler(
            {
                case_ids: [801],
                output_dir: testTempDir,
            },
            mockClient
        );

        expect(result.success).toBe(true);
        const mdContent = await fs.promises.readFile(path.join(testTempDir, 'C801.md'), 'utf-8');
        expect(mdContent).not.toContain('## Empty Steps Field');
    });

    test('uses default output_dir when not provided and handles object in unstructured markdown fields', async () => {
        const customFieldsSchema: CaseField[] = [
            { id: 1, name: 'json_blob', system_name: 'custom_json_blob', label: 'JSON Blob', type_id: 3, template_ids: [], include_all: true, is_active: true, description: null, configs: [] },
        ];

        getCaseFieldsMock.mockResolvedValue(customFieldsSchema);

        const mockCase: Case = {
            id: 901,
            title: 'Default Dir Case',
            section_id: 10,
            template_id: 1,
            type_id: 1,
            priority_id: 1,
            milestone_id: null,
            refs: null,
            created_on: 1700000000,
            updated_on: 1700005000,
            estimate: null,
            suite_id: 1,
            labels: [],
            custom_json_blob: { key: 'value', nested: 123 },
        } as any;

        getCaseMock.mockResolvedValue(mockCase);
        getSectionMock.mockResolvedValue({ id: 10, name: 'Section 10' } as any);

        const result = await exportCasesForRagTool.handler(
            {
                case_ids: [901],
            },
            mockClient
        );

        expect(result.success).toBe(true);
        tempDirs.push(result.output_dir);

        const mdContent = await fs.promises.readFile(path.join(result.output_dir, 'C901.md'), 'utf-8');
        expect(mdContent).toContain('## JSON Blob');
        expect(mdContent).toContain('"key": "value"');
    });

    test('handles relative output_dir correctly', async () => {
        const mockCase: Case = {
            id: 902,
            title: 'Relative Dir Case',
            section_id: 10,
            template_id: 1,
            type_id: 1,
            priority_id: 1,
            milestone_id: null,
            refs: null,
            created_on: 1700000000,
            updated_on: 1700005000,
            estimate: null,
            suite_id: 1,
            labels: [],
        } as any;

        getCaseMock.mockResolvedValue(mockCase);
        getSectionMock.mockResolvedValue({ id: 10, name: 'Section 10' } as any);

        const relativeDir = `test_rag_relative_${Date.now()}`;
        const result = await exportCasesForRagTool.handler(
            {
                case_ids: [902],
                output_dir: relativeDir,
            },
            mockClient
        );

        expect(result.success).toBe(true);
        expect(path.isAbsolute(result.output_dir)).toBe(true);
        expect(result.output_dir.endsWith(relativeDir)).toBe(true);
        tempDirs.push(result.output_dir);
        expect(fs.existsSync(path.join(result.output_dir, 'C902.md'))).toBe(true);
    });

    test('falls back safely when process.cwd() and PWD are /', async () => {
        const originalCwd = process.cwd;
        const originalPwd = process.env.PWD;
        const originalInitCwd = process.env.INIT_CWD;

        try {
            process.cwd = () => '/';
            process.env.PWD = '/';
            delete process.env.INIT_CWD;

            const mockCase: Case = {
                id: 903,
                title: 'Root CWD Fallback Case',
                section_id: 10,
                template_id: 1,
                type_id: 1,
                priority_id: 1,
                milestone_id: null,
                refs: null,
                created_on: 1700000000,
                updated_on: 1700005000,
                estimate: null,
                suite_id: 1,
                labels: [],
            } as any;

            getCaseMock.mockResolvedValue(mockCase);
            getSectionMock.mockResolvedValue({ id: 10, name: 'Section 10' } as any);

            const result = await exportCasesForRagTool.handler(
                {
                    case_ids: [903],
                },
                mockClient
            );

            expect(result.success).toBe(true);
            expect(result.output_dir.startsWith(os.homedir()) || result.output_dir.startsWith(os.tmpdir())).toBe(true);
            expect(result.output_dir.startsWith('/rag_export_')).toBe(false);
            tempDirs.push(result.output_dir);
            expect(fs.existsSync(path.join(result.output_dir, 'C903.md'))).toBe(true);
        } finally {
            process.cwd = originalCwd;
            process.env.PWD = originalPwd;
            if (originalInitCwd !== undefined) {
                process.env.INIT_CWD = originalInitCwd;
            }
        }
    });
});


