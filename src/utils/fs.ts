import * as fs from "fs";
import * as os from "os";

/**
 * Resolves a safe, writable base directory for exports and file operations.
 *
 * When the MCP server is spawned by host applications (IDE daemons, npx, Claude Desktop, Cursor, Gemini),
 * `process.cwd()` or `process.env.PWD` often resolves to the root filesystem (`"/"`), where direct writes
 * fail with ENOENT / permission errors (especially on macOS read-only APFS volumes).
 *
 * This function handles multi-environment fallbacks:
 * 1. `process.env.INIT_CWD`: Set by package managers (npm/npx/pnpm) to the original caller's working directory.
 * 2. `process.cwd()` / `process.env.PWD`: Used if pointing to a valid non-root directory.
 * 3. `os.homedir()`: User home directory fallback if the working directory is root or invalid.
 * 4. `os.tmpdir()`: Final safety fallback.
 */
export function getBaseDirectory(): string {
    const candidates = [
        process.env.INIT_CWD,
        process.cwd(),
        process.env.PWD,
        os.homedir(),
    ];

    for (const candidate of candidates) {
        if (candidate && candidate !== "/" && candidate.trim() !== "") {
            try {
                if (fs.existsSync(candidate)) {
                    return candidate;
                }
            } catch {
                // Ignore and try next candidate
            }
        }
    }

    return os.tmpdir();
}
