import { describe, test, expect } from '@jest/globals';
import { sanitizeValue, removeNullish } from '../../src/utils/sanitizer.js';

describe('sanitizeValue', () => {
    test('strips style attributes from string values', () => {
        const input = '<p style="color: red; font-size: 14px;">Hello</p>';
        expect(sanitizeValue(input)).toBe('<p>Hello</p>');
    });

    test('strips multiple style attributes', () => {
        const input = '<div style="margin: 10px;"><span style="font-weight: bold;">Text</span></div>';
        expect(sanitizeValue(input)).toBe('<div><span>Text</span></div>');
    });

    test('handles single quotes in style', () => {
        const input = "<p style='color: blue;'>Text</p>";
        expect(sanitizeValue(input)).toBe('<p>Text</p>');
    });

    test('preserves other attributes', () => {
        const input = '<a href="http://example.com" style="color: blue;" class="link">Link</a>';
        expect(sanitizeValue(input)).toBe('<a href="http://example.com" class="link">Link</a>');
    });

    test('returns unchanged text without styles', () => {
        const input = '<p>No styles here</p>';
        expect(sanitizeValue(input)).toBe('<p>No styles here</p>');
    });
    test('sanitizes string values', () => {
        const input = '<p style="color: red;">Hello</p>';
        expect(sanitizeValue(input)).toBe('<p>Hello</p>');
    });

    test('sanitizes nested objects', () => {
        const input = {
            content: '<div style="margin: 10px;">Step 1</div>',
            expected: '<p style="color: green;">Result</p>'
        };
        const result = sanitizeValue(input);
        expect(result.content).toBe('<div>Step 1</div>');
        expect(result.expected).toBe('<p>Result</p>');
    });

    test('sanitizes arrays', () => {
        const input = [
            { content: '<span style="font-size: 12px;">Item 1</span>' },
            { content: '<span style="font-size: 14px;">Item 2</span>' }
        ];
        const result = sanitizeValue(input);
        expect(result[0].content).toBe('<span>Item 1</span>');
        expect(result[1].content).toBe('<span>Item 2</span>');
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
