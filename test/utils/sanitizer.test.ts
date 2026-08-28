import { describe, test, expect } from '@jest/globals';
import { sanitizeValue, htmlToMarkdown, removeNullish, isActive, normalizeEntityId } from '../../src/utils/sanitizer.js';

describe('htmlToMarkdown & sanitizeValue', () => {
    test('converts paragraph tags and strips style attributes to clean text', () => {
        const input = '<p style="color: red; font-size: 14px;">Hello World</p>';
        expect(sanitizeValue(input)).toBe('Hello World');
    });

    test('converts ordered lists to numbered markdown format', () => {
        const input = '<ol><li>First step</li><li>Second step</li></ol>';
        expect(htmlToMarkdown(input)).toBe('1. First step\n2. Second step');
    });

    test('converts unordered lists to dash bullet format', () => {
        const input = '<ul><li>Option A</li><li>Option B</li></ul>';
        expect(htmlToMarkdown(input)).toBe('- Option A\n- Option B');
    });

    test('extracts attachment images with data-attachment-id', () => {
        const input = '<span class="markdown-img-container"><img src="index.php?/attachments/get/b0dd22aa-634b-4116-b85e-025ac45ba4f9" data-attachment-id="b0dd22aa-634b-4116-b85e-025ac45ba4f9" width="300"></span>';
        expect(htmlToMarkdown(input)).toBe('[Attachment: b0dd22aa-634b-4116-b85e-025ac45ba4f9]');
    });

    test('extracts attachment images from attachment src URL without explicit data-attachment-id', () => {
        const input = '<img src="index.php?/attachments/get/12345678-abcd-ef01-2345-6789abcdef01" class="fr-fic">';
        expect(htmlToMarkdown(input)).toBe('[Attachment: 12345678-abcd-ef01-2345-6789abcdef01]');
    });

    test('converts regular images with src and alt', () => {
        const input = '<img src="https://example.com/logo.png" alt="Company Logo">';
        expect(htmlToMarkdown(input)).toBe('![Company Logo](https://example.com/logo.png)');
    });

    test('converts links to markdown format', () => {
        const input = '<a href="http://example.com" style="color: blue;" class="link">Visit Website</a>';
        expect(htmlToMarkdown(input)).toBe('[Visit Website](http://example.com)');
    });

    test('converts text formatting: bold, italic, code', () => {
        const input = '<strong>Bold</strong> and <em>Italic</em> and <code>var x = 1;</code>';
        expect(htmlToMarkdown(input)).toBe('**Bold** and *Italic* and `var x = 1;`');
    });

    test('decodes common HTML entities', () => {
        const input = 'Admin -&gt; Stores &amp; Config &quot;Checkout&quot; &#39;test&#39;';
        expect(htmlToMarkdown(input)).toBe('Admin -> Stores & Config "Checkout" \'test\'');
    });

    test('handles complex TestRail precondition markup', () => {
        const input = '<ol><li><p>Street restrictions are configured in Magento Admin -&gt; Stores -&gt; Configuration -&gt; BDA -&gt; Customer -&gt; Address Restrictions<br>(e.g. use regex = \'(\\bp\\.?o\\.?\\s?box\\b|\\bP\\.O\\.B\\b|\\bPOB\\b)\')<br><span class="markdown-img-container"><img src="index.php?/attachments/get/b0dd22aa-634b-4116-b85e-025ac45ba4f9" class="fr-fic fr-dib fr-fil markdown-img" width="300" id="attachment-b0dd22aa-634b-4116-b85e-025ac45ba4f9" data-attachment-id="b0dd22aa-634b-4116-b85e-025ac45ba4f9" data-entity-id="86069"></span></p></li></ol>';
        const expected = '1. Street restrictions are configured in Magento Admin -> Stores -> Configuration -> BDA -> Customer -> Address Restrictions\n(e.g. use regex = \'(\\bp\\.?o\\.?\\s?box\\b|\\bP\\.O\\.B\\b|\\bPOB\\b)\')\n[Attachment: b0dd22aa-634b-4116-b85e-025ac45ba4f9]';
        expect(htmlToMarkdown(input)).toBe(expected);
    });

    test('returns unchanged text when no HTML tags or entities exist', () => {
        const input = 'Simple plain text without formatting';
        expect(htmlToMarkdown(input)).toBe('Simple plain text without formatting');
    });

    test('sanitizes nested objects recursively', () => {
        const input = {
            content: '<div style="margin: 10px;"><p>Step 1</p></div>',
            expected: '<p style="color: green;">Result: &lt;OK&gt;</p>'
        };
        const result = sanitizeValue(input);
        expect(result.content).toBe('Step 1');
        expect(result.expected).toBe('Result: <OK>');
    });

    test('sanitizes arrays recursively', () => {
        const input = [
            { content: '<span style="font-size: 12px;"><p>Item 1</p></span>' },
            { content: '<span style="font-size: 14px;"><p>Item 2</p></span>' }
        ];
        const result = sanitizeValue(input);
        expect(result[0].content).toBe('Item 1');
        expect(result[1].content).toBe('Item 2');
    });

    test('preserves non-string values', () => {
        expect(sanitizeValue(42)).toBe(42);
        expect(sanitizeValue(true)).toBe(true);
        expect(sanitizeValue(null)).toBe(null);
    });
});

describe('removeNullish', () => {
    test('removes null values from object', () => {
        const input = { a: 1, b: null, c: 3 };
        expect(removeNullish(input)).toEqual({ a: 1, c: 3 });
    });

    test('removes undefined values from object', () => {
        const input = { a: 1, b: undefined, c: 3 };
        expect(removeNullish(input)).toEqual({ a: 1, c: 3 });
    });

    test('handles nested objects', () => {
        const input = {
            name: 'test',
            metadata: { id: 1, value: null, active: true },
            count: null
        };
        expect(removeNullish(input)).toEqual({
            name: 'test',
            metadata: { id: 1, active: true }
        });
    });

    test('filters null items from arrays', () => {
        const input = [1, null, 3, undefined, 5];
        expect(removeNullish(input)).toEqual([1, 3, 5]);
    });

    test('cleans nested objects in arrays', () => {
        const input = [
            { id: 1, name: 'item1', value: null },
            { id: 2, name: null, value: 'test' }
        ];
        expect(removeNullish(input)).toEqual([
            { id: 1, name: 'item1' },
            { id: 2, value: 'test' }
        ]);
    });

    test('handles deeply nested structures', () => {
        const input = {
            projects: [
                {
                    id: 1,
                    name: 'Project A',
                    metadata: { created: null, updated: '2024-01-01' },
                    tags: [null, 'important', undefined, 'urgent']
                },
                null
            ],
            count: undefined
        };
        expect(removeNullish(input)).toEqual({
            projects: [
                {
                    id: 1,
                    name: 'Project A',
                    metadata: { updated: '2024-01-01' },
                    tags: ['important', 'urgent']
                }
            ]
        });
    });

    test('preserves primitive values', () => {
        expect(removeNullish(42)).toBe(42);
        expect(removeNullish('test')).toBe('test');
        expect(removeNullish(true)).toBe(true);
        expect(removeNullish(0)).toBe(0);
        expect(removeNullish('')).toBe('');
        expect(removeNullish(false)).toBe(false);
    });

    test('returns null/undefined as-is for root values', () => {
        expect(removeNullish(null)).toBe(null);
        expect(removeNullish(undefined)).toBe(undefined);
    });

    test('handles empty objects and arrays', () => {
        expect(removeNullish({})).toEqual({});
        expect(removeNullish([])).toEqual([]);
    });
});

describe('isActive', () => {
    test('returns true for truthy values (1, true, "1", "true")', () => {
        expect(isActive(1)).toBe(true);
        expect(isActive(true)).toBe(true);
        expect(isActive('1')).toBe(true);
        expect(isActive('true')).toBe(true);
    });

    test('returns false for falsy values (0, false, "0", "false", null, undefined, other strings)', () => {
        expect(isActive(0)).toBe(false);
        expect(isActive(false)).toBe(false);
        expect(isActive('0')).toBe(false);
        expect(isActive('false')).toBe(false);
        expect(isActive(null)).toBe(false);
        expect(isActive(undefined)).toBe(false);
        expect(isActive('active')).toBe(false);
    });

    test('supports passing the parent object directly', () => {
        expect(isActive({ id: 1, is_active: 1 })).toBe(true);
        expect(isActive({ id: 2, is_active: true })).toBe(true);
        expect(isActive({ id: 3, is_active: 0 })).toBe(false);
        expect(isActive({ id: 4, is_active: false })).toBe(false);
        expect(isActive({ id: 5 })).toBe(false);
        expect(isActive({})).toBe(false);
    });
});

describe('normalizeEntityId', () => {
    test('returns number as-is when given a number', () => {
        expect(normalizeEntityId(123)).toBe(123);
    });

    test('parses numeric string', () => {
        expect(normalizeEntityId('456')).toBe(456);
    });

    test('strips "C" or "c" prefix and trims whitespace', () => {
        expect(normalizeEntityId('C789')).toBe(789);
        expect(normalizeEntityId('c789')).toBe(789);
        expect(normalizeEntityId('  C100  ')).toBe(100);
    });

    test('throws error for invalid non-numeric string', () => {
        expect(() => normalizeEntityId('invalid')).toThrow('Invalid entity ID: invalid');
    });
});

