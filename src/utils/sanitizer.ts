/**
 * Decodes standard and numeric HTML entities.
 */
function decodeHtmlEntities(str: string): string {
    return str
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

/**
 * Converts TestRail HTML markup to clean, structured Markdown / plain text.
 */
export function htmlToMarkdown(html: string): string {
    if (!html || typeof html !== 'string') {
        return html;
    }

    // Quick path if no HTML tags or entities
    if (!html.includes('<') && !html.includes('&')) {
        return html.trim();
    }

    let text = html;

    // Normalize line breaks
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Process images / attachments (e.g. data-attachment-id, attachment get URL, or general image)
    text = text.replace(/<span[^>]*class="[^"]*markdown-img-container[^"]*"[^>]*>([\s\S]*?)<\/span>/gi, '$1');
    text = text.replace(/<img\b([^>]*)>/gi, (_, attrs) => {
        const attachmentIdMatch = attrs.match(/data-attachment-id=["']([^"']+)["']/i)
            || attrs.match(/id=["']attachment-([^"']+)["']/i)
            || attrs.match(/src=["'][^"']*attachments\/get\/([a-zA-Z0-9-]+)[^"']*["']/i);

        if (attachmentIdMatch) {
            return `[Attachment: ${attachmentIdMatch[1]}]`;
        }

        const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
        const altMatch = attrs.match(/alt=["']([^"']*)["']/i);
        if (srcMatch) {
            const alt = altMatch ? altMatch[1] : 'Image';
            return `![${alt}](${srcMatch[1]})`;
        }

        return '[Image]';
    });

    // Headings <h1> - <h6>
    text = text.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, content) => {
        return `\n${'#'.repeat(Number(level))} ${content.trim()}\n\n`;
    });

    // Preformatted & code blocks
    text = text.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, code) => `\n\`\`\`\n${code}\n\`\`\`\n`);
    text = text.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_, code) => `\n\`\`\`\n${code}\n\`\`\`\n`);
    text = text.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');

    // Formatting: Bold, Italic, Strikethrough
    text = text.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**');
    text = text.replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*');
    text = text.replace(/<(del|s|strike)\b[^>]*>([\s\S]*?)<\/\1>/gi, '~~$2~~');

    // Links
    text = text.replace(/<a\b[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

    // Paragraphs, breaks, dividers, divs (process before lists so li content is cleanly trimmed)
    text = text.replace(/<hr\b[^>]*\/?>/gi, '\n---\n');
    text = text.replace(/<br\b[^>]*\/?>/gi, '\n');
    text = text.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n');
    text = text.replace(/<div\b[^>]*>([\s\S]*?)<\/div>/gi, '\n$1\n');

    // Ordered & Unordered Lists
    text = text.replace(/<ol\b[^>]*>([\s\S]*?)<\/ol>/gi, (_, listContent) => {
        let index = 1;
        const items = listContent.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (__: string, itemContent: string) => {
            const cleaned = itemContent.trim();
            return `\n${index++}. ${cleaned}`;
        });
        return `\n${items}\n`;
    });

    text = text.replace(/<ul\b[^>]*>([\s\S]*?)<\/ul>/gi, (_, listContent) => {
        const items = listContent.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (__: string, itemContent: string) => {
            const cleaned = itemContent.trim();
            return `\n- ${cleaned}`;
        });
        return `\n${items}\n`;
    });

    // Strip remaining HTML tags
    text = text.replace(/<[^>]+>/g, '');

    // Decode HTML entities
    text = decodeHtmlEntities(text);

    // Clean up whitespace and newlines
    const lines = text.split('\n').map(line => line.trimEnd());
    text = lines.join('\n');
    text = text.replace(/\n{3,}/g, '\n\n');

    return text.trim();
}

/**
 * Recursively cleans HTML from TestRail strings, converting HTML markup
 * to clean Markdown/plaintext and decoding entities.
 */
export function sanitizeValue(value: any): any {
    if (typeof value === 'string') {
        return htmlToMarkdown(value);
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

/**
 * Checks if an entity is active by checking its active flag.
 * Supports passing either the direct primitive value or the parent object containing `.is_active`.
 */
export function isActive(value: any): boolean {
    if (value == null) {
        return false;
    }
    const activeFlag = (typeof value === 'object') ? value.is_active : value;
    return activeFlag === 1 || activeFlag === true || activeFlag === '1' || activeFlag === 'true';
}

/**
 * Normalizes an entity ID (e.g. case ID, run ID, attachment ID).
 * Handles string IDs with 'C' prefixes (e.g. 'C123' -> 123), numeric IDs, and trims whitespace.
 */
export function normalizeEntityId(id: number | string): number {
    const idString = typeof id === "string" ? id.trim() : String(id);
    const cleaned = idString.toUpperCase().startsWith("C") ? idString.substring(1) : idString;
    const parsed = Number(cleaned);
    if (isNaN(parsed)) {
        throw new Error(`Invalid entity ID: ${id}`);
    }
    return parsed;
}

