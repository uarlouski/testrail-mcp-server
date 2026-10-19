import * as crypto from "crypto";

export const DEFAULT_VOLATILE_KEYS = new Set<string>([
    "content_hash",
    "export_time",
    "exported_at",
    "output_path",
    "output_dir",
]);

/**
 * Serializes a value to canonical JSON with sorted object keys,
 * normalized \n line endings, and volatile keys omitted.
 */
export function canonicalizeJson(val: any, volatileKeys: Set<string> = DEFAULT_VOLATILE_KEYS): string {
    if (val === undefined) {
        return "null";
    }
    if (val === null || typeof val !== "object") {
        if (typeof val === "string") {
            return JSON.stringify(val.replace(/\r\n/g, "\n"));
        }
        return JSON.stringify(val);
    }

    if (Array.isArray(val)) {
        return "[" + val.map(item => canonicalizeJson(item, volatileKeys)).join(",") + "]";
    }

    const sortedKeys = Object.keys(val)
        .filter(key => !volatileKeys.has(key) && val[key] !== undefined)
        .sort();

    const entries = sortedKeys.map(key => {
        return JSON.stringify(key) + ":" + canonicalizeJson(val[key], volatileKeys);
    });

    return "{" + entries.join(",") + "}";
}

/**
 * Computes a deterministic SHA-256 content hash of the exported Markdown body
 * and its companion metadataAttributes (excluding content_hash and volatile keys).
 *
 * Formula: sha256( markdown body + "\n" + canonical JSON of metadataAttributes, excluding content_hash )
 * Format: "sha256:<hex>"
 */
export function computeContentHash(
    markdownBody: string,
    metadataAttributes: Record<string, any>,
    volatileKeys: Set<string> = DEFAULT_VOLATILE_KEYS
): string {
    const normalizedMarkdown = markdownBody.replace(/\r\n/g, "\n");
    const canonicalJson = canonicalizeJson(metadataAttributes, volatileKeys);
    const hashInput = `${normalizedMarkdown}\n${canonicalJson}`;
    const digest = crypto.createHash("sha256").update(hashInput, "utf-8").digest("hex");
    return `sha256:${digest}`;
}
