import { describe, test, expect } from "@jest/globals";
import * as crypto from "crypto";
import {
    canonicalizeJson,
    computeContentHash,
    DEFAULT_VOLATILE_KEYS,
} from "../../src/utils/content_hash.js";

describe("content_hash utils", () => {
    describe("canonicalizeJson", () => {
        test("serializes primitive values correctly", () => {
            expect(canonicalizeJson(null)).toBe("null");
            expect(canonicalizeJson(undefined)).toBe("null");
            expect(canonicalizeJson(123)).toBe("123");
            expect(canonicalizeJson(true)).toBe("true");
            expect(canonicalizeJson(false)).toBe("false");
            expect(canonicalizeJson("hello world")).toBe('"hello world"');
        });

        test("normalizes CRLF line endings to LF in strings", () => {
            expect(canonicalizeJson("line1\r\nline2\r\nline3")).toBe('"line1\\nline2\\nline3"');
        });

        test("sorts object keys recursively", () => {
            const input = {
                z: 1,
                a: {
                    d: "foo",
                    b: "bar",
                },
                m: [3, 2, 1],
            };
            const expected = '{"a":{"b":"bar","d":"foo"},"m":[3,2,1],"z":1}';
            expect(canonicalizeJson(input)).toBe(expected);
        });

        test("produces identical JSON regardless of object key insertion order", () => {
            const objA = { alpha: 1, beta: 2, gamma: { y: "yes", n: "no" } };
            const objB = { beta: 2, gamma: { n: "no", y: "yes" }, alpha: 1 };
            expect(canonicalizeJson(objA)).toBe(canonicalizeJson(objB));
        });

        test("omits volatile keys and content_hash", () => {
            const input = {
                case_id: 101,
                content_hash: "sha256:abc123",
                export_time: 1700000000,
                exported_at: "2026-10-13T00:00:00Z",
                output_path: "/tmp/exports/C101.md",
                output_dir: "/tmp/exports",
                title: "Test",
            };
            const expected = '{"case_id":101,"title":"Test"}';
            expect(canonicalizeJson(input)).toBe(expected);
        });

        test("omits undefined object properties and converts undefined array elements to null", () => {
            const input = {
                defined: 42,
                notDefined: undefined,
                arr: [1, undefined, 3],
            };
            expect(canonicalizeJson(input)).toBe('{"arr":[1,null,3],"defined":42}');
        });

        test("preserves array ordering while sorting nested object elements", () => {
            const input = [
                { z: 1, a: 2 },
                { y: 3, b: 4 },
            ];
            expect(canonicalizeJson(input)).toBe('[{"a":2,"z":1},{"b":4,"y":3}]');
        });
    });

    describe("computeContentHash", () => {
        test("computes SHA-256 with sha256: prefix matching 64 hex characters", () => {
            const md = "# [C101] Test Case\n\n**Section**: Smoke\n";
            const meta = { case_id: 101, title: "Test Case", priority: "High" };
            const hash = computeContentHash(md, meta);

            expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
        });

        test("matches manual sha256 computation of normalized body + newline + canonical JSON", () => {
            const md = "# [C101] Manual Test\n";
            const meta = { case_id: 101, title: "Manual Test" };

            const canonical = '{"case_id":101,"title":"Manual Test"}';
            const expectedDigest = crypto
                .createHash("sha256")
                .update(`${md}\n${canonical}`, "utf-8")
                .digest("hex");

            expect(computeContentHash(md, meta)).toBe(`sha256:${expectedDigest}`);
        });

        test("is invariant to metadataAttributes key insertion order", () => {
            const md = "# [C1] Title\n";
            const meta1 = { a: 1, b: "2", c: [1, 2] };
            const meta2 = { c: [1, 2], a: 1, b: "2" };

            expect(computeContentHash(md, meta1)).toBe(computeContentHash(md, meta2));
        });

        test("is invariant to CRLF vs LF line endings in markdown body and metadata strings", () => {
            const mdLF = "# Title\n\nLine 1\nLine 2\n";
            const mdCRLF = "# Title\r\n\r\nLine 1\r\nLine 2\r\n";

            const metaLF = { notes: "A\nB" };
            const metaCRLF = { notes: "A\r\nB" };

            expect(computeContentHash(mdLF, metaLF)).toBe(computeContentHash(mdCRLF, metaCRLF));
        });

        test("is idempotent when content_hash is already present in metadataAttributes", () => {
            const md = "# Case\n";
            const meta: Record<string, any> = { case_id: 99, title: "Case" };

            const hash1 = computeContentHash(md, meta);
            meta.content_hash = hash1;
            const hash2 = computeContentHash(md, meta);

            expect(hash2).toBe(hash1);
        });

        test("changes when markdown body changes", () => {
            const meta = { case_id: 1, title: "Title" };
            const hash1 = computeContentHash("# Title 1\n", meta);
            const hash2 = computeContentHash("# Title 2\n", meta);

            expect(hash1).not.toBe(hash2);
        });

        test("changes when metadata attributes change", () => {
            const md = "# Same Body\n";
            const hash1 = computeContentHash(md, { case_id: 1, priority: "High" });
            const hash2 = computeContentHash(md, { case_id: 1, priority: "Low" });

            expect(hash1).not.toBe(hash2);
        });

        test("supports multi-byte UTF-8 characters accurately", () => {
            const md = "# Тестовый кейс\n";
            const meta = { title: "Тест", emoji: "🚀" };
            const hash = computeContentHash(md, meta);

            expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
        });
    });
});
