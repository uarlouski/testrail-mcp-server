import { TestRailClient } from "../client/testrail.js";
import { z } from "zod";
import { AttachmentSchema } from "../types/testrail.js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import archiver from "archiver";
import { ToolDefinition } from "../types/custom.js";

const parameters = {
    run_id: z.string().describe("The ID of the test run to attach the file to"),
    file_path: z.string().describe("The path to the file or directory to attach. Directories will be automatically zipped."),
}

export const addAttachmentToRunTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "add_attachment_to_run",
    description: "Add an attachment to a test run in TestRail. If the file_path points to a directory, it will be automatically zipped before uploading. Maximum upload size is 256MB.",
    parameters,
    handler: async ({ run_id, file_path }, client: TestRailClient) => {
        if (!fs.existsSync(file_path)) {
            throw new Error(`File or directory not found: ${file_path}`);
        }

        const stats = fs.statSync(file_path);
        let uploadPath: string = file_path;
        let filename: string = path.basename(file_path);
        let isTemporary = false;

        if (stats.isDirectory()) {
            const basename = path.basename(file_path);
            const tempDir = os.tmpdir();
            const zipPath = path.join(tempDir, `${basename}-${Date.now()}.zip`);

            await new Promise<void>((resolve, reject) => {
                const output = fs.createWriteStream(zipPath);
                const archive = archiver('zip', {
                    zlib: { level: 9 }
                });

                output.on('close', () => resolve());
                archive.on('error', (err) => reject(err));

                archive.pipe(output);
                archive.directory(file_path, basename);
                archive.finalize();
            });

            uploadPath = zipPath;
            filename = `${basename}.zip`;
            isTemporary = true;
        }

        try {
            const result = await client.addAttachmentToRun(Number(run_id), uploadPath, filename);
            return AttachmentSchema.parse(result);
        } finally {
            if (isTemporary && fs.existsSync(uploadPath)) {
                fs.unlinkSync(uploadPath);
            }
        }
    },
};
