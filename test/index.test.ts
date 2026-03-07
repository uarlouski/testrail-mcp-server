import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { z } from 'zod';

// We need to mock process.exit and console.error before importing index.ts
// because it runs code at the top level
const originalEnv = process.env;
let exitMock: any;
let errorMock: any;

describe('index.ts environment validation', () => {
    beforeEach(() => {
        jest.resetModules(); // clears the cache
        process.env = { ...originalEnv };
        exitMock = jest.spyOn(process, 'exit').mockImplementation((() => { }) as any);
        errorMock = jest.spyOn(console, 'error').mockImplementation(() => { });

        // Mock the McpServer and other dependencies that run module-level code
        jest.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
            McpServer: jest.fn().mockImplementation(() => ({
                registerTool: jest.fn(),
                connect: jest.fn()
            }))
        }));

        jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
            StdioServerTransport: jest.fn()
        }));
    });

    afterEach(() => {
        process.env = originalEnv;
        jest.restoreAllMocks();
    });

    test('exits with code 1 if environment variables are missing', async () => {
        // Clear required env vars
        delete process.env.TESTRAIL_INSTANCE_URL;
        delete process.env.TESTRAIL_USERNAME;
        delete process.env.TESTRAIL_API_KEY;

        try {
            await import('../src/index.js');
        } catch (e) {
            // ignore loading errors if any occur after exit
        }

        expect(exitMock).toHaveBeenCalledWith(1);
        expect(errorMock).toHaveBeenCalledWith(
            expect.stringContaining('Invalid TestRail environment configuration:'),
            expect.any(String)
        );
    });

    test('exits with code 1 if URL is invalid', async () => {
        process.env.TESTRAIL_INSTANCE_URL = 'not-a-url';
        process.env.TESTRAIL_USERNAME = 'test@example.com';
        process.env.TESTRAIL_API_KEY = 'secret';

        try {
            await import('../src/index.js');
        } catch (e) {
            // ignore
        }

        expect(exitMock).toHaveBeenCalledWith(1);
        const errorMessage = errorMock.mock.calls[0][1];
        expect(errorMessage).toContain('Must be a valid TestRail URL');
    });

    test('exits with code 1 if email is invalid', async () => {
        process.env.TESTRAIL_INSTANCE_URL = 'https://testrail.com';
        process.env.TESTRAIL_USERNAME = 'not-an-email';
        process.env.TESTRAIL_API_KEY = 'secret';

        try {
            await import('../src/index.js');
        } catch (e) {
            // ignore
        }

        expect(exitMock).toHaveBeenCalledWith(1);
        const errorMessage = errorMock.mock.calls[0][1];
        expect(errorMessage).toContain('Must be a valid email address');
    });

    test('succeeds with valid environment variables', async () => {
        process.env.TESTRAIL_INSTANCE_URL = 'https://testrail.com';
        process.env.TESTRAIL_USERNAME = 'test@example.com';
        process.env.TESTRAIL_API_KEY = 'secret';

        await import('../src/index.js');

        expect(exitMock).not.toHaveBeenCalled();
        expect(errorMock).not.toHaveBeenCalled();
    });
});
