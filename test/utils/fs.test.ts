import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import * as os from 'os';
import { getBaseDirectory } from '../../src/utils/fs.js';

describe('fs utils', () => {
    const originalCwd = process.cwd;
    const originalEnv = { ...process.env };

    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.cwd = originalCwd;
        process.env = { ...originalEnv };
    });

    test('returns process.env.INIT_CWD when set and directory exists', () => {
        const testDir = os.tmpdir();
        process.env.INIT_CWD = testDir;

        const result = getBaseDirectory();
        expect(result).toBe(testDir);
    });

    test('ignores INIT_CWD if it is root or does not exist', () => {
        process.env.INIT_CWD = '/';
        const result = getBaseDirectory();
        expect(result).not.toBe('/');
        expect(result).toBeDefined();

        process.env.INIT_CWD = '/non_existent_directory_for_test_12345';
        const resultNonExistent = getBaseDirectory();
        expect(resultNonExistent).not.toBe('/non_existent_directory_for_test_12345');
    });

    test('returns process.cwd() when INIT_CWD is not set and cwd is not root', () => {
        delete process.env.INIT_CWD;
        const testDir = os.tmpdir();
        process.cwd = () => testDir;

        const result = getBaseDirectory();
        expect(result).toBe(testDir);
    });

    test('falls back to PWD when cwd is root and PWD is valid non-root', () => {
        delete process.env.INIT_CWD;
        process.cwd = () => '/';
        const testDir = os.tmpdir();
        process.env.PWD = testDir;

        const result = getBaseDirectory();
        expect(result).toBe(testDir);
    });

    test('falls back to homedir when cwd and PWD are root', () => {
        delete process.env.INIT_CWD;
        process.cwd = () => '/';
        process.env.PWD = '/';

        const result = getBaseDirectory();
        expect(result).toBe(os.homedir());
    });

    test('falls back to homedir when candidates point to non-existent paths', () => {
        process.env.INIT_CWD = '/non_existent_init_cwd_123';
        process.cwd = () => '/';
        process.env.PWD = '/non_existent_pwd_456';

        const result = getBaseDirectory();
        expect(result).toBe(os.homedir());
    });
});
