import { z } from "zod";
import fs from "fs";
import path from "path";
import { TestRailClient } from "../../client/testrail.js";
import { ToolDefinition } from "../../types/custom.js";
import { normalizeEntityId } from "../../utils/sanitizer.js";
import { CaseHistoryEntrySchema, CaseHistoryResponse } from "./types.js";

const parameters = {
    case_id: z.string().describe("The ID of the test case (e.g. '123' or 'C123')"),
    limit: z.number().min(1).optional().describe("Maximum number of revisions to return (e.g. 5 for the last 5 revisions)"),
    after_revision: z.number().optional().describe("Filter to only include revisions strictly newer than this revision ID (id > after_revision)"),
    after_timestamp: z.number().optional().describe("Filter to only include revisions created after this unix timestamp (created_on > after_timestamp)"),
    order: z.enum(["desc", "asc"]).optional().default("desc").describe("Sort order for the returned history entries ('desc' for newest-to-oldest, 'asc' for oldest-to-newest). Default is 'desc'"),
    output_file: z.string().optional().describe("Absolute file path to save the JSON response to. Useful for large history change logs to avoid context limits."),
};

export const getCaseHistoryTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "get_case_history",
    mode: "read",
    description: "Returns the revision and change history of a test case. Useful for tracking case updates, checking changes since a specific revision or timestamp, or getting the last N revisions.",
    parameters,
    handler: async ({ case_id, limit, after_revision, after_timestamp, order = "desc", output_file }, client) => {
        const id = normalizeEntityId(case_id);

        const allHistory = await client.getCaseHistory(id);

        let latestRevision: number | null = null;

        if (allHistory.length > 0) {
            const sortedByRevisionDesc = [...allHistory].sort((a, b) => b.id - a.id);
            latestRevision = sortedByRevisionDesc[0].id;
        }


        let filtered = [...allHistory];

        if (after_revision !== undefined) {
            filtered = filtered.filter(entry => entry.id > after_revision);
        }

        if (after_timestamp !== undefined) {
            filtered = filtered.filter(entry => (entry.created_on ?? 0) > after_timestamp);
        }

        filtered.sort((a, b) => {
            if (order === "asc") {
                return a.id - b.id;
            }
            return b.id - a.id;
        });

        if (limit !== undefined) {
            filtered = filtered.slice(0, limit);
        }

        const parsedHistory = filtered.map(h => CaseHistoryEntrySchema.parse(h));

        const response: CaseHistoryResponse = {
            case_id: id,
            latest_revision: latestRevision,
            has_changes: parsedHistory.length > 0,
            history: parsedHistory,
        };

        if (output_file) {
            const dir = path.dirname(output_file);
            if (dir && !fs.existsSync(dir)) {
                await fs.promises.mkdir(dir, { recursive: true });
            }
            await fs.promises.writeFile(output_file, JSON.stringify(response, null, 2), "utf-8");
            return {
                success: true,
                message: `Successfully exported ${response.history.length} history records to ${output_file}`,
                file: output_file,
                latest_revision: latestRevision,
                has_changes: response.has_changes,
            };
        }

        return response;
    },
};

