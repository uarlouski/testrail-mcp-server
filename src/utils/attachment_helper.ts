import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import archiver from "archiver";

/**
 * Normalizes an entity ID (case ID or run ID).
 * Handles string IDs with 'C' prefixes (e.g. 'C123' -> 123) and numeric IDs.
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

/**
 * Prepares a file or directory for upload.
 * If the path points to a directory, it will automatically be zipped to a temporary archive.
 * Ensures temporary zip files are cleaned up in a finally block.
 */
export async function prepareUploadFile<T>(
    filePath: string,
    uploadCallback: (uploadPath: string, filename: string) => Promise<T>
): Promise<T> {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File or directory not found: ${filePath}`);
    }

    const stats = fs.statSync(filePath);
    let uploadPath: string = filePath;
    let filename: string = path.basename(filePath);
    let isTemporary = false;

    if (stats.isDirectory()) {
        const basename = path.basename(filePath);
        const tempDir = os.tmpdir();
        const zipPath = path.join(tempDir, `${basename}-${Date.now()}.zip`);

        await new Promise<void>((resolve, reject) => {
            const output = fs.createWriteStream(zipPath);
            const archive = archiver("zip", {
                zlib: { level: 9 },
            });

            output.on("close", () => resolve());
            archive.on("error", (err) => reject(err));

            archive.pipe(output);
            archive.directory(filePath, basename);
            archive.finalize();
        });

        uploadPath = zipPath;
        filename = `${basename}.zip`;
        isTemporary = true;
    }

    try {
        return await uploadCallback(uploadPath, filename);
    } finally {
        if (isTemporary && fs.existsSync(uploadPath)) {
            fs.unlinkSync(uploadPath);
        }
    }
}
