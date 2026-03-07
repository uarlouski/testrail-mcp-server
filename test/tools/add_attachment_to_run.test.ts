import { jest, describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { addAttachmentToRunTool } from '../../src/tools/add_attachment_to_run.js';
import { TestRailClient } from '../../src/client/testrail.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('addAttachmentToRunTool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let testTempDir: string;

    beforeAll(() => {
        testTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'testrail-mcp-test-'));
    });

    afterAll(() => {
        fs.rmSync(testTempDir, { recursive: true, force: true });
    });

    beforeEach(() => {
        mockClient = {
            addAttachmentToRun: jest.fn()
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('has correct name and description', () => {
        expect(addAttachmentToRunTool.name).toBe('add_attachment_to_run');
        expect(addAttachmentToRunTool.description).toBeDefined();
    });

    test('throws error if file_path does not exist', async () => {
        const fakePath = path.join(testTempDir, 'does-not-exist.txt');
        await expect(addAttachmentToRunTool.handler({
            run_id: 1,
            file_path: fakePath
        }, mockClient)).rejects.toThrow(`File or directory not found: ${fakePath}`);
    });

    test('attaches a regular file successfully', async () => {
        const filePath = path.join(testTempDir, 'test.txt');
        fs.writeFileSync(filePath, 'Hello World');

        const mockAttachmentResult = {
            attachment_id: 12345
        };

        mockClient.addAttachmentToRun.mockResolvedValue(mockAttachmentResult as any);

        const result = await addAttachmentToRunTool.handler({
            run_id: 1,
            file_path: filePath
        }, mockClient);

        expect(mockClient.addAttachmentToRun).toHaveBeenCalledWith(1, filePath, 'test.txt');
        expect(result).toEqual(mockAttachmentResult);
    });

    test('zips and attaches a directory successfully', async () => {
        const dirPath = path.join(testTempDir, 'testdir');
        fs.mkdirSync(dirPath);
        fs.writeFileSync(path.join(dirPath, 'file1.txt'), 'Content 1');
        fs.writeFileSync(path.join(dirPath, 'file2.txt'), 'Content 2');

        const mockAttachmentResult = {
            attachment_id: 54321
        };
        mockClient.addAttachmentToRun.mockResolvedValue(mockAttachmentResult as any);

        const result = await addAttachmentToRunTool.handler({
            run_id: 1,
            file_path: dirPath
        }, mockClient);

        expect(mockClient.addAttachmentToRun).toHaveBeenCalledWith(
            1,
            expect.stringMatching(/testdir-\d+\.zip$/),
            'testdir.zip'
        );
        expect(result).toEqual(mockAttachmentResult);

        // Verify the temporary zip file was cleaned up
        const calledZipPath = mockClient.addAttachmentToRun.mock.calls[0][1];
        expect(fs.existsSync(calledZipPath)).toBe(false);
    });
});
