/**
 * Recursively ыtrips inline style attributes from HTML tags contained in string values
 * in an object or array. Useful for cleaning up TestRail markdown content before sending
 * to LLMs.
 */
export function sanitizeValue(value: any): any {
    if (typeof value === 'string') {
        return value.replace(/\s*style\s*=\s*["'][^"']*["']/gi, '');
    }
    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }
    if (value !== null && typeof value === 'object') {
        const result: Record<string, any> = {};
        for (const [key, val] of Object.entries(value)) {
            result[key] = sanitizeValue(val);
        }
        return result;
    }
    return value;
}
