import { jest, describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { normalizeEntityId, prepareUploadFile } from '../../src/utils/attachment_helper.js';

describe('attachment_helper', () => {
    let testTempDir: string;

    beforeAll(() => {
        testTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'attachment-helper-test-'));
    });

    afterAll(() => {
        fs.rmSync(testTempDir, { recursive: true, force: true });
    });

    describe('normalizeEntityId', () => {
        test('normalizes numeric ID', () => {
            expect(normalizeEntityId(123)).toBe(123);
        });

        test('normalizes string numeric ID', () => {
            expect(normalizeEntityId('456')).toBe(456);
        });

        test('normalizes case ID with C prefix (lowercase or uppercase)', () => {
            expect(normalizeEntityId('C789')).toBe(789);
            expect(normalizeEntityId('c789')).toBe(789);
        });

        test('throws on invalid ID', () => {
            expect(() => normalizeEntityId('invalid')).toThrow('Invalid entity ID: invalid');
        });
    });

    describe('prepareUploadFile', () => {
        test('throws error if filePath does not exist', async () => {
            const nonExistent = path.join(testTempDir, 'does-not-exist.txt');
            await expect(prepareUploadFile(nonExistent, async () => { })).rejects.toThrow(
                `File or directory not found: ${nonExistent}`
            );
        });

        test('handles single file without creating zip', async () => {
            const filePath = path.join(testTempDir, 'file.txt');
            fs.writeFileSync(filePath, 'hello');

            const result = await prepareUploadFile(filePath, async (uploadPath, filename) => {
                expect(uploadPath).toBe(filePath);
                expect(filename).toBe('file.txt');
                return { uploaded: true };
            });

            expect(result).toEqual({ uploaded: true });
        });

        test('handles directory by creating and cleaning up zip', async () => {
            const dirPath = path.join(testTempDir, 'test-dir');
            fs.mkdirSync(dirPath, { recursive: true });
            fs.writeFileSync(path.join(dirPath, 'inner.txt'), 'inside');

            let capturedUploadPath = '';

            const result = await prepareUploadFile(dirPath, async (uploadPath, filename) => {
                capturedUploadPath = uploadPath;
                expect(uploadPath).toMatch(/test-dir-\d+\.zip$/);
                expect(filename).toBe('test-dir.zip');
                expect(fs.existsSync(uploadPath)).toBe(true);
                return { uploaded: true };
            });

            expect(result).toEqual({ uploaded: true });
            // Zip should be deleted after callback completes
            expect(fs.existsSync(capturedUploadPath)).toBe(false);
        });

        test('cleans up zip even if upload callback throws', async () => {
            const dirPath = path.join(testTempDir, 'error-dir');
            fs.mkdirSync(dirPath, { recursive: true });
            fs.writeFileSync(path.join(dirPath, 'error.txt'), 'data');

            let capturedUploadPath = '';

            await expect(prepareUploadFile(dirPath, async (uploadPath) => {
                capturedUploadPath = uploadPath;
                throw new Error('Upload failed');
            })).rejects.toThrow('Upload failed');

            expect(fs.existsSync(capturedUploadPath)).toBe(false);
        });
    });
});
