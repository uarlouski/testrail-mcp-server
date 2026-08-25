import { describe, test, expect } from '@jest/globals';
import { getToolsToRegister } from '../../src/tools/registry.js';

describe('Tools Registry (getToolsToRegister)', () => {
    test('exports getToolsToRegister function', () => {
        expect(typeof getToolsToRegister).toBe('function');
    });

    test('returns default tools when enableSharedSteps is false or undefined', () => {
        const toolsDefault = getToolsToRegister({});
        const toolsFalse = getToolsToRegister({ enableSharedSteps: false });

        expect(toolsDefault).toBeDefined();
        expect(Array.isArray(toolsDefault)).toBe(true);
        expect(toolsDefault.length).toBe(27); // 27 default tools (delete_entity excluded by default)

        expect(toolsFalse).toBeDefined();
        expect(Array.isArray(toolsFalse)).toBe(true);
        expect(toolsFalse.length).toBe(27);

        // Check tool names are present
        const names = toolsDefault.map(t => t.name);
        expect(names).toContain('query_project');
        expect(names).toContain('get_case');
        expect(names).toContain('resolve_case_field');
        expect(names).toContain('mutate_run');
        expect(names).toContain('add_attachment');
        expect(names).toContain('query_attachment');
        expect(names).toContain('add_attachment_to_run');

        // Ensure shared steps tools are NOT present
        expect(names).not.toContain('get_shared_steps');
        expect(names).not.toContain('add_shared_step');

        // Ensure case history tool is NOT present by default
        expect(names).not.toContain('get_case_history');
    });

    test('returns default tools plus case history tool when enableCaseHistory is true', () => {
        const tools = getToolsToRegister({ enableCaseHistory: true });
        expect(tools.length).toBe(28);
        const names = tools.map(t => t.name);
        expect(names).toContain('get_case_history');
    });

    test('returns default tools plus shared steps tools when enableSharedSteps is true (with allowDelete: true)', () => {
        const tools = getToolsToRegister({ enableSharedSteps: true, allowDelete: true });

        expect(tools).toBeDefined();
        expect(Array.isArray(tools)).toBe(true);
        expect(tools.length).toBe(33); // 28 base + 5 shared steps tools

        const names = tools.map(t => t.name);
        expect(names).toContain('query_project');
        expect(names).toContain('get_case');
        expect(names).toContain('resolve_case_field');
        expect(names).toContain('add_attachment');
        expect(names).toContain('query_attachment');
        expect(names).toContain('add_attachment_to_run');

        // Ensure shared steps tools ARE present
        expect(names).toContain('get_shared_steps');
        expect(names).toContain('get_shared_step');
        expect(names).toContain('get_shared_step_history');
        expect(names).toContain('add_shared_step');
        expect(names).toContain('update_shared_step');
        expect(names).toContain('delete_entity');
    });

    test('excludes delete tools by default', () => {
        const tools = getToolsToRegister({ enableSharedSteps: true });
        expect(tools.length).toBe(32); // delete_entity is excluded by default (33 - 1)
        const names = tools.map(t => t.name);
        expect(names).not.toContain('delete_entity');
    });

    test('filters tools based on allowWrite and allowRead permissions', () => {
        // Test allowWrite: false
        const noWrite = getToolsToRegister({ allowWrite: false });
        expect(noWrite.length).toBe(17); // 17 read tools
        expect(noWrite.every(t => t.mode !== 'write')).toBe(true);

        // Test allowRead: false
        const noRead = getToolsToRegister({ allowRead: false });
        expect(noRead.length).toBe(10); // 10 write tools
        expect(noRead.every(t => t.mode !== 'read')).toBe(true);
    });

    test('filters deprecated tools based on enableDeprecatedTools', () => {
        // By default, deprecated tools are enabled
        const defaultTools = getToolsToRegister({});
        const defaultNames = defaultTools.map(t => t.name);
        expect(defaultNames).toContain('add_attachment_to_run');
        expect(defaultTools.length).toBe(27);

        // Explicit enableDeprecatedTools: false
        const noDeprecated = getToolsToRegister({ enableDeprecatedTools: false });
        const noDeprecatedNames = noDeprecated.map(t => t.name);
        expect(noDeprecatedNames).not.toContain('add_attachment_to_run');
        expect(noDeprecated.length).toBe(26);
        expect(noDeprecated.every(t => !t.deprecated)).toBe(true);

        // Explicit enableDeprecatedTools: true
        const withDeprecated = getToolsToRegister({ enableDeprecatedTools: true });
        const withDeprecatedNames = withDeprecated.map(t => t.name);
        expect(withDeprecatedNames).toContain('add_attachment_to_run');
        expect(withDeprecated.length).toBe(27);
    });

    test('all returned tools have valid structures', () => {
        const tools = getToolsToRegister({ enableSharedSteps: true, allowDelete: true });

        for (const tool of tools) {
            expect(tool).toBeDefined();
            expect(typeof tool.name).toBe('string');
            expect(typeof tool.description).toBe('string');
            expect(tool.parameters).toBeDefined();
            expect(typeof tool.handler).toBe('function');
        }
    });

    test('all returned tools have correct annotations based on tool mode', () => {
        const tools = getToolsToRegister({ enableSharedSteps: true, allowDelete: true });

        for (const tool of tools) {
            expect(tool.annotations).toBeDefined();
            if (tool.mode === 'read') {
                expect(tool.annotations).toEqual({
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true
                });
            } else if (tool.mode === 'write') {
                expect(tool.annotations).toEqual({
                    readOnlyHint: false,
                    destructiveHint: false,
                    idempotentHint: false
                });
            } else if (tool.mode === 'delete') {
                expect(tool.annotations).toEqual({
                    readOnlyHint: false,
                    destructiveHint: true,
                    idempotentHint: false
                });
            }
        }
    });
});
