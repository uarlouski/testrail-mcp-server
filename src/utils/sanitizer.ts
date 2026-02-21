/**
 * Recursively strips inline style attributes from HTML tags contained in string values
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

/**
 * Recursively removes null and undefined values from objects and arrays.
 * For arrays, filters nested object items as well.
 */
export function removeNullish(value: any): any {
    if (value == null) {
        return value;
    }

    if (Array.isArray(value)) {
        return value
            .map(item => removeNullish(item))
            .filter(item => item != null);
    }

    if (typeof value === 'object') {
        const result: Record<string, any> = {};
        for (const [key, val] of Object.entries(value)) {
            const cleanedVal = removeNullish(val);
            if (cleanedVal != null) {
                result[key] = cleanedVal;
            }
        }
        return result;
    }

    return value;
}
