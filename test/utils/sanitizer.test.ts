import { describe, test, expect } from '@jest/globals';
import { sanitizeValue } from '../../src/utils/sanitizer.js';

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
