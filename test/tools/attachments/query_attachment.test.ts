import { jest, describe, test, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
import { queryAttachmentTool } from '../../../src/tools/attachments/query_attachment.js';
import { TestRailClient } from '../../../src/client/testrail.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('queryAttachmentTool', () => {
    let mockClient: jest.Mocked<TestRailClient>;
    let testTempDir: string;

    beforeAll(() => {
        testTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'query-attachments-test-'));
    });

    afterAll(() => {
        fs.rmSync(testTempDir, { recursive: true, force: true });
    });

    beforeEach(() => {
        mockClient = {
            getAttachment: jest.fn(),
            getAttachments: jest.fn(),
        } as unknown as jest.Mocked<TestRailClient>;
    });

    test('has correct name, mode and description', () => {
        expect(queryAttachmentTool.name).toBe('query_attachment');
        expect(queryAttachmentTool.mode).toBe('read');
        expect(queryAttachmentTool.description).toBeDefined();
    });

    describe('action: "one"', () => {
        test('downloads an attachment by numeric ID', async () => {
            const destFile = path.join(testTempDir, 'downloaded.png');
            mockClient.getAttachment.mockResolvedValue({
                file: destFile,
                size: 2048,
            });

            const result = await queryAttachmentTool.handler({
                payload: {
                    action: 'one',
                    attachment_id: 12345,
                    output_file: destFile,
                },
            }, mockClient);

            expect(mockClient.getAttachment).toHaveBeenCalledWith(12345, destFile);
            expect(result).toEqual({
                success: true,
                message: `Successfully downloaded attachment 12345 (2048 bytes) to ${destFile}`,
                file: destFile,
                size: 2048,
            });
        });

        test('downloads an attachment by UUID string ID', async () => {
            const destFile = path.join(testTempDir, 'downloaded_uuid.pdf');
            mockClient.getAttachment.mockResolvedValue({
                file: destFile,
                size: 10240,
            });

            const result = await queryAttachmentTool.handler({
                payload: {
                    action: 'one',
                    attachment_id: 'uuid-67890',
                    output_file: destFile,
                },
            }, mockClient);

            expect(mockClient.getAttachment).toHaveBeenCalledWith('uuid-67890', destFile);
            expect(result).toEqual({
                success: true,
                message: `Successfully downloaded attachment uuid-67890 (10240 bytes) to ${destFile}`,
                file: destFile,
                size: 10240,
            });
        });
    });

    describe('action: "many"', () => {
        test('retrieves attachments for a case with numeric ID', async () => {
            const mockAttachments = [
                {
                    id: 1,
                    filename: 'screenshot.png',
                    size: 1024,
                    file_type: 'image/png',
                    is_image: true,
                },
            ];
            mockClient.getAttachments.mockResolvedValue(mockAttachments as any);

            const result = await queryAttachmentTool.handler({
                payload: {
                    action: 'many',
                    entity_type: 'case',
                    entity_id: 123,
                },
            }, mockClient);

            expect(mockClient.getAttachments).toHaveBeenCalledWith('case', 123);
            expect(result).toEqual({ attachments: mockAttachments });
        });

        test('retrieves attachments for a case with C-prefixed string ID', async () => {
            const mockAttachments = [
                {
                    id: 'uuid-1234',
                    filename: 'image.jpg',
                    size: 2048,
                },
            ];
            mockClient.getAttachments.mockResolvedValue(mockAttachments as any);

            const result = await queryAttachmentTool.handler({
                payload: {
                    action: 'many',
                    entity_type: 'case',
                    entity_id: 'C456',
                },
            }, mockClient);

            expect(mockClient.getAttachments).toHaveBeenCalledWith('case', 456);
            expect(result).toEqual({ attachments: mockAttachments });
        });

        test('retrieves attachments for a run', async () => {
            const mockAttachments = [
                {
                    id: 2,
                    filename: 'run_output.log',
                    size: 512,
                },
            ];
            mockClient.getAttachments.mockResolvedValue(mockAttachments as any);

            const result = await queryAttachmentTool.handler({
                payload: {
                    action: 'many',
                    entity_type: 'run',
                    entity_id: 88,
                },
            }, mockClient);

            expect(mockClient.getAttachments).toHaveBeenCalledWith('run', 88);
            expect(result).toEqual({ attachments: mockAttachments });
        });

        test('exports response to output_file when provided', async () => {
            const mockAttachments = [
                { id: 10, filename: 'file1.txt', size: 100 },
            ];
            mockClient.getAttachments.mockResolvedValue(mockAttachments as any);

            const outputFile = path.join(testTempDir, 'exported_attachments.json');

            const result = await queryAttachmentTool.handler({
                payload: {
                    action: 'many',
                    entity_type: 'case',
                    entity_id: 123,
                    output_file: outputFile,
                },
            }, mockClient);

            expect(result).toEqual({
                success: true,
                message: `Successfully exported 1 attachments to ${outputFile}`,
                file: outputFile,
            });

            expect(fs.existsSync(outputFile)).toBe(true);
            const writtenContent = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
            expect(writtenContent).toEqual({ attachments: mockAttachments });
        });
    });
});
