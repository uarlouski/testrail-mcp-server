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
        expect(toolsDefault.length).toBe(19); // 19 default tools

        expect(toolsFalse).toBeDefined();
        expect(Array.isArray(toolsFalse)).toBe(true);
        expect(toolsFalse.length).toBe(19);

        // Check a few default tool names are present
        const names = toolsDefault.map(t => t.name);
        expect(names).toContain('get_projects');
        expect(names).toContain('get_case');
        expect(names).toContain('add_run');
        
        // Ensure shared steps tools are NOT present
        expect(names).not.toContain('get_shared_steps');
        expect(names).not.toContain('add_shared_step');
    });

    test('returns default tools plus shared steps tools when enableSharedSteps is true (with allowDelete: true)', () => {
        const tools = getToolsToRegister({ enableSharedSteps: true, allowDelete: true });

        expect(tools).toBeDefined();
        expect(Array.isArray(tools)).toBe(true);
        expect(tools.length).toBe(25); // 19 default + 6 shared steps tools

        const names = tools.map(t => t.name);
        expect(names).toContain('get_projects');
        expect(names).toContain('get_case');
        
        // Ensure shared steps tools ARE present
        expect(names).toContain('get_shared_steps');
        expect(names).toContain('get_shared_step');
        expect(names).toContain('get_shared_step_history');
        expect(names).toContain('add_shared_step');
        expect(names).toContain('update_shared_step');
        expect(names).toContain('delete_shared_step');
    });

    test('excludes delete tools by default', () => {
        const tools = getToolsToRegister({ enableSharedSteps: true });
        expect(tools.length).toBe(24); // delete_shared_step is excluded by default
        const names = tools.map(t => t.name);
        expect(names).not.toContain('delete_shared_step');
    });

    test('filters tools based on allowCreate, allowRead, allowUpdate permissions', () => {
        // Test allowCreate: false
        const noCreate = getToolsToRegister({ allowCreate: false });
        expect(noCreate.length).toBe(14); // 19 - 5 create tools
        expect(noCreate.every(t => t.mode !== 'create')).toBe(true);

        // Test allowRead: false
        const noRead = getToolsToRegister({ allowRead: false });
        expect(noRead.length).toBe(7); // 19 - 12 read tools
        expect(noRead.every(t => t.mode !== 'read')).toBe(true);

        // Test allowUpdate: false
        const noUpdate = getToolsToRegister({ allowUpdate: false });
        expect(noUpdate.length).toBe(17); // 19 - 2 update tools
        expect(noUpdate.every(t => t.mode !== 'update')).toBe(true);
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
});
