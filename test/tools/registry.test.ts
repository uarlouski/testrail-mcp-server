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
        expect(toolsDefault.length).toBe(28); // 28 default tools (delete_entity excluded by default)

        expect(toolsFalse).toBeDefined();
        expect(Array.isArray(toolsFalse)).toBe(true);
        expect(toolsFalse.length).toBe(28);

        // Check tool names are present
        const names = toolsDefault.map(t => t.name);
        expect(names).toContain('query_project');
        expect(names).toContain('query_section');
        expect(names).toContain('get_sections');
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

        // Ensure RAG export tool is NOT present by default
        expect(names).not.toContain('export_cases_for_rag');
    });

    test('returns default tools plus case history tool when enableCaseHistory is true', () => {
        const tools = getToolsToRegister({ enableCaseHistory: true });
        expect(tools.length).toBe(29);
        const names = tools.map(t => t.name);
        expect(names).toContain('get_case_history');
    });

    test('returns default tools plus RAG export tool when enableRagTools is true', () => {
        const tools = getToolsToRegister({ enableRagTools: true });
        expect(tools.length).toBe(29);
        const names = tools.map(t => t.name);
        expect(names).toContain('export_cases_for_rag');
    });

    test('returns default tools plus shared steps tools when enableSharedSteps is true (with allowDelete: true)', () => {
        const tools = getToolsToRegister({ enableSharedSteps: true, allowDelete: true });

        expect(tools).toBeDefined();
        expect(Array.isArray(tools)).toBe(true);
        expect(tools.length).toBe(34); // 28 base + 5 shared steps tools + 1 delete_entity

        const names = tools.map(t => t.name);
        expect(names).toContain('query_project');
        expect(names).toContain('query_section');
        expect(names).toContain('get_sections');
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
        expect(tools.length).toBe(33); // delete_entity is excluded by default (34 - 1)
        const names = tools.map(t => t.name);
        expect(names).not.toContain('delete_entity');
    });

    test('filters tools based on allowWrite and allowRead permissions', () => {
        // Test allowWrite: false
        const noWrite = getToolsToRegister({ allowWrite: false });
        expect(noWrite.length).toBe(18); // 18 read tools
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
        expect(defaultNames).toContain('get_sections');
        expect(defaultTools.length).toBe(28);

        // Explicit enableDeprecatedTools: false
        const noDeprecated = getToolsToRegister({ enableDeprecatedTools: false });
        const noDeprecatedNames = noDeprecated.map(t => t.name);
        expect(noDeprecatedNames).not.toContain('add_attachment_to_run');
        expect(noDeprecatedNames).not.toContain('get_sections');
        expect(noDeprecated.length).toBe(26);
        expect(noDeprecated.every(t => !t.deprecated)).toBe(true);

        // Explicit enableDeprecatedTools: true
        const withDeprecated = getToolsToRegister({ enableDeprecatedTools: true });
        const withDeprecatedNames = withDeprecated.map(t => t.name);
        expect(withDeprecatedNames).toContain('add_attachment_to_run');
        expect(withDeprecatedNames).toContain('get_sections');
        expect(withDeprecated.length).toBe(28);
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

    test('filters out tools specified in disabledTools', () => {
        const defaultTools = getToolsToRegister({});
        expect(defaultTools.some(t => t.name === 'get_case')).toBe(true);
        expect(defaultTools.some(t => t.name === 'mutate_run')).toBe(true);

        const toolsWithDisabled = getToolsToRegister({
            disabledTools: ['get_case', 'mutate_run']
        });

        expect(toolsWithDisabled.length).toBe(defaultTools.length - 2);
        expect(toolsWithDisabled.some(t => t.name === 'get_case')).toBe(false);
        expect(toolsWithDisabled.some(t => t.name === 'mutate_run')).toBe(false);
    });

    test('throws error listing all non-existent tools when unknown tool names are provided in disabledTools', () => {
        expect(() => getToolsToRegister({
            disabledTools: ['fake_tool_one', 'get_case', 'fake_tool_two']
        })).toThrow('Cannot disable non-existent tool(s): fake_tool_one, fake_tool_two');
    });

    test('allows disabling conditional/gated tools without error', () => {
        // Gated tools (like shared steps and case history) exist in the system and should be recognized as valid tool names
        const tools = getToolsToRegister({
            enableSharedSteps: true,
            disabledTools: ['get_shared_steps', 'get_case_history']
        });

        const names = tools.map(t => t.name);
        expect(names).not.toContain('get_shared_steps');
        expect(names).not.toContain('get_case_history');
    });
});

