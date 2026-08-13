import { jest, describe, test, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
import { addAttachmentTool } from '../../../src/tools/attachments/add_attachment.js';
import { TestRailClient } from '../../../src/client/testrail.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('addAttachmentTool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let testTempDir: string;

    beforeAll(() => {
        testTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'add-attachment-test-'));
    });

    afterAll(() => {
        fs.rmSync(testTempDir, { recursive: true, force: true });
    });

    beforeEach(() => {
        mockClient = {
            addAttachment: jest.fn(),
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('has correct name, mode and description', () => {
        expect(addAttachmentTool.name).toBe('add_attachment');
        expect(addAttachmentTool.mode).toBe('write');
        expect(addAttachmentTool.description).toBeDefined();
    });

    test('throws error if file_path does not exist', async () => {
        const fakePath = path.join(testTempDir, 'does-not-exist.png');
        await expect(addAttachmentTool.handler({
            entity_type: 'case',
            entity_id: 1,
            file_path: fakePath,
        }, mockClient)).rejects.toThrow(`File or directory not found: ${fakePath}`);
    });

    test('attaches a regular file to a case with numeric ID', async () => {
        const filePath = path.join(testTempDir, 'screenshot.png');
        fs.writeFileSync(filePath, 'fake image data');

        const mockResult = { attachment_id: 101 };
        mockClient.addAttachment.mockResolvedValue(mockResult as any);

        const result = await addAttachmentTool.handler({
            entity_type: 'case',
            entity_id: 123,
            file_path: filePath,
        }, mockClient);

        expect(mockClient.addAttachment).toHaveBeenCalledWith('case', 123, filePath, 'screenshot.png');
        expect(result).toEqual(mockResult);
    });

    test('attaches a regular file to a case with C-prefixed string ID', async () => {
        const filePath = path.join(testTempDir, 'evidence.log');
        fs.writeFileSync(filePath, 'log contents');

        const mockResult = { attachment_id: 102 };
        mockClient.addAttachment.mockResolvedValue(mockResult as any);

        const result = await addAttachmentTool.handler({
            entity_type: 'case',
            entity_id: 'C456',
            file_path: filePath,
        }, mockClient);

        expect(mockClient.addAttachment).toHaveBeenCalledWith('case', 456, filePath, 'evidence.log');
        expect(result).toEqual(mockResult);
    });

    test('attaches a regular file to a run', async () => {
        const filePath = path.join(testTempDir, 'run_log.txt');
        fs.writeFileSync(filePath, 'run log');

        const mockResult = { attachment_id: 201 };
        mockClient.addAttachment.mockResolvedValue(mockResult as any);

        const result = await addAttachmentTool.handler({
            entity_type: 'run',
            entity_id: 50,
            file_path: filePath,
        }, mockClient);

        expect(mockClient.addAttachment).toHaveBeenCalledWith('run', 50, filePath, 'run_log.txt');
        expect(result).toEqual(mockResult);
    });

    test('zips and attaches a directory to a case', async () => {
        const dirPath = path.join(testTempDir, 'artifacts');
        fs.mkdirSync(dirPath, { recursive: true });
        fs.writeFileSync(path.join(dirPath, 'report.html'), '<html></html>');

        const mockResult = { attachment_id: 301 };
        mockClient.addAttachment.mockResolvedValue(mockResult as any);

        const result = await addAttachmentTool.handler({
            entity_type: 'case',
            entity_id: 789,
            file_path: dirPath,
        }, mockClient);

        expect(mockClient.addAttachment).toHaveBeenCalledWith(
            'case',
            789,
            expect.stringMatching(/artifacts-\d+\.zip$/),
            'artifacts.zip'
        );
        expect(result).toEqual(mockResult);

        // Verify temp zip was cleaned up
        const calledZipPath = mockClient.addAttachment.mock.calls[0][2];
        expect(fs.existsSync(calledZipPath)).toBe(false);
    });
});
