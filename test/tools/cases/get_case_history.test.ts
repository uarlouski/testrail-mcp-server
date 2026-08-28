import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { getCaseHistoryTool } from '../../../src/tools/cases/get_case_history.js';
import { TestRailClient } from '../../../src/client/testrail.js';
import { CaseHistoryEntry } from '../../../src/tools/cases/types.js';

describe('get_case_history tool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let getCaseHistoryMock: jest.Mock<(id: number) => Promise<CaseHistoryEntry[]>>;
    let tempDir: string;

    const mockHistory: CaseHistoryEntry[] = [
        {
            id: 101,
            case_id: 123,
            user_id: 1,
            created_on: 1600000000,
            type_id: 1,
            changes: [
                { field: 'title', old_value: 'Initial Title', new_value: 'Updated Title 1' }
            ]
        },
        {
            id: 102,
            case_id: 123,
            user_id: 2,
            created_on: 1600001000,
            type_id: 1,
            changes: [
                { field: 'priority_id', old_value: 2, new_value: 3 }
            ]
        },
        {
            id: 103,
            case_id: 123,
            user_id: 1,
            created_on: 1600002000,
            type_id: 1,
            changes: [
                { field: 'custom_steps', old_value: 'Old step', new_value: 'New step' }
            ]
        }
    ];

    beforeEach(() => {
        getCaseHistoryMock = jest.fn<(id: number) => Promise<CaseHistoryEntry[]>>();
        mockClient = {
            getCaseHistory: getCaseHistoryMock,
        } as unknown as jest.Mocked<TestRailClient>;
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'case-history-test-'));
    });

    afterEach(() => {
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    test('exports correct tool definition and metadata', () => {
        expect(getCaseHistoryTool.name).toBe('get_case_history');
        expect(getCaseHistoryTool.mode).toBe('read');
        expect(getCaseHistoryTool.description).toBeDefined();
        expect(getCaseHistoryTool.parameters).toBeDefined();
    });

    test('fetches full history for numeric case_id and defaults to newest-first order', async () => {
        getCaseHistoryMock.mockResolvedValue(mockHistory);

        const result = await getCaseHistoryTool.handler({ case_id: '123' }, mockClient);

        expect(mockClient.getCaseHistory).toHaveBeenCalledWith(123);
        expect(result).toEqual({
            case_id: 123,
            latest_revision: 103,
            has_changes: true,
            history: [
                {
                    id: 103,
                    created_on: 1600002000,
                    changes: [{ field: 'custom_steps', old_value: 'Old step', new_value: 'New step' }]
                },
                {
                    id: 102,
                    created_on: 1600001000,
                    changes: [{ field: 'priority_id', old_value: 2, new_value: 3 }]
                },
                {
                    id: 101,
                    created_on: 1600000000,
                    changes: [{ field: 'title', old_value: 'Initial Title', new_value: 'Updated Title 1' }]
                },
            ],
        });
    });

    test('normalizes "C" prefixed case ID (e.g. C123 -> 123)', async () => {
        getCaseHistoryMock.mockResolvedValue(mockHistory);

        const result = await getCaseHistoryTool.handler({ case_id: 'C123' }, mockClient);

        expect(mockClient.getCaseHistory).toHaveBeenCalledWith(123);
        expect(result.case_id).toBe(123);
    });

    test('handles empty history for an unmodified test case', async () => {
        getCaseHistoryMock.mockResolvedValue([]);

        const result = await getCaseHistoryTool.handler({ case_id: '456' }, mockClient);

        expect(result).toEqual({
            case_id: 456,
            latest_revision: null,
            has_changes: false,
            history: [],
        });
    });

    test('limits results to last N revisions when limit is provided', async () => {
        getCaseHistoryMock.mockResolvedValue(mockHistory);

        const result = await getCaseHistoryTool.handler({ case_id: '123', limit: 2 }, mockClient);

        expect(result.history.length).toBe(2);
        expect(result.history).toEqual([
            {
                id: 103,
                created_on: 1600002000,
                changes: [{ field: 'custom_steps', old_value: 'Old step', new_value: 'New step' }]
            },
            {
                id: 102,
                created_on: 1600001000,
                changes: [{ field: 'priority_id', old_value: 2, new_value: 3 }]
            },
        ]);
        expect(result.latest_revision).toBe(103);
    });

    test('filters history strictly after given revision ID with after_revision', async () => {
        getCaseHistoryMock.mockResolvedValue(mockHistory);

        const result = await getCaseHistoryTool.handler({ case_id: '123', after_revision: 101 }, mockClient);

        expect(result.history.length).toBe(2);
        expect(result.has_changes).toBe(true);
        expect(result.history).toEqual([
            {
                id: 103,
                created_on: 1600002000,
                changes: [{ field: 'custom_steps', old_value: 'Old step', new_value: 'New step' }]
            },
            {
                id: 102,
                created_on: 1600001000,
                changes: [{ field: 'priority_id', old_value: 2, new_value: 3 }]
            },
        ]);
        expect(result.latest_revision).toBe(103);
    });

    test('returns has_changes: false when no revisions exist after after_revision', async () => {
        getCaseHistoryMock.mockResolvedValue(mockHistory);

        const result = await getCaseHistoryTool.handler({ case_id: '123', after_revision: 103 }, mockClient);

        expect(result.history.length).toBe(0);
        expect(result.has_changes).toBe(false);
        expect(result.history).toEqual([]);
        expect(result.latest_revision).toBe(103);
    });

    test('filters history strictly after given timestamp with after_timestamp', async () => {
        getCaseHistoryMock.mockResolvedValue(mockHistory);

        const result = await getCaseHistoryTool.handler({ case_id: '123', after_timestamp: 1600001000 }, mockClient);

        expect(result.history.length).toBe(1);
        expect(result.history).toEqual([
            {
                id: 103,
                created_on: 1600002000,
                changes: [{ field: 'custom_steps', old_value: 'Old step', new_value: 'New step' }]
            }
        ]);
    });


    test('combines after_revision and limit correctly', async () => {
        getCaseHistoryMock.mockResolvedValue(mockHistory);

        const result = await getCaseHistoryTool.handler({ case_id: '123', after_revision: 100, limit: 1 }, mockClient);

        expect(result.history.length).toBe(1);
        expect(result.history).toEqual([
            {
                id: 103,
                created_on: 1600002000,
                changes: [{ field: 'custom_steps', old_value: 'Old step', new_value: 'New step' }]
            }
        ]);
    });

    test('supports ascending sort order (order: "asc")', async () => {
        getCaseHistoryMock.mockResolvedValue(mockHistory);

        const result = await getCaseHistoryTool.handler({ case_id: '123', order: 'asc' }, mockClient);

        expect(result.history).toEqual([
            {
                id: 101,
                created_on: 1600000000,
                changes: [{ field: 'title', old_value: 'Initial Title', new_value: 'Updated Title 1' }]
            },
            {
                id: 102,
                created_on: 1600001000,
                changes: [{ field: 'priority_id', old_value: 2, new_value: 3 }]
            },
            {
                id: 103,
                created_on: 1600002000,
                changes: [{ field: 'custom_steps', old_value: 'Old step', new_value: 'New step' }]
            },
        ]);
    });


    test('exports response to output_file when specified', async () => {
        getCaseHistoryMock.mockResolvedValue(mockHistory);
        const outputFile = path.join(tempDir, 'sub', 'history.json');

        const result = await getCaseHistoryTool.handler({ case_id: '123', output_file: outputFile }, mockClient);

        expect(result).toEqual({
            success: true,
            message: `Successfully exported 3 history records to ${outputFile}`,
            file: outputFile,
            latest_revision: 103,
            has_changes: true,
        });

        expect(fs.existsSync(outputFile)).toBe(true);
        const fileContent = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
        expect(fileContent.case_id).toBe(123);
        expect(fileContent.history.length).toBe(3);
    });

    test('filters by after_timestamp when some entries have null/undefined created_on', async () => {
        const historyWithNullCreatedOn = [
            { id: 101, case_id: 123, created_on: null as any, changes: [] },
            { id: 102, case_id: 123, created_on: 1600005000, changes: [] },
        ];
        getCaseHistoryMock.mockResolvedValue(historyWithNullCreatedOn);

        const result = await getCaseHistoryTool.handler({ case_id: '123', after_timestamp: 1600001000 }, mockClient);
        expect(result.history.length).toBe(1);
        expect(result.history[0].id).toBe(102);
    });

    test('writes to output_file when output directory already exists', async () => {
        getCaseHistoryMock.mockResolvedValue(mockHistory);
        const outputFile = path.join(tempDir, 'history_existing_dir.json');

        const result = await getCaseHistoryTool.handler({ case_id: '123', output_file: outputFile }, mockClient);
        expect(result.success).toBe(true);
        expect(fs.existsSync(outputFile)).toBe(true);
    });

    test('propagates errors from client.getCaseHistory', async () => {
        getCaseHistoryMock.mockRejectedValue(new Error('Network error'));

        await expect(
            getCaseHistoryTool.handler({ case_id: '123' }, mockClient)
        ).rejects.toThrow('Network error');
    });
});
