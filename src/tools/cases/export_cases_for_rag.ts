import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { normalizeEntityId, sanitizeValue } from "../../utils/sanitizer.js";
import { processCustomFields } from "../../utils/mapper.js";
import { TestRailClient } from "../../client/testrail.js";
import { ToolDefinition } from "../../types/custom.js";
import { Case, CaseField } from "./types.js";
import { CaseFieldTypeId, getFieldType } from "./fields.js";

const parameters = {
    case_ids: z.array(z.union([z.string(), z.number()])).min(1).describe("List of test case IDs (e.g. ['C123', 456])"),
    output_dir: z.string().optional().describe("Directory to save exported files. Defaults to an auto-generated directory in the current working directory."),
};

function formatStepsSeparated(steps: any[]): string {
    return steps.map((step, idx) => {
        const stepNum = idx + 1;
        const content = typeof step.content === "string" ? sanitizeValue(step.content).trim() : "";
        const expected = typeof step.expected === "string" ? sanitizeValue(step.expected).trim() : "";
        const additionalInfo = typeof step.additional_info === "string" ? sanitizeValue(step.additional_info).trim() : "";

        let stepText = `${stepNum}. **Action**: ${content}`;
        if (additionalInfo) {
            stepText += `\n   - **Info**: ${additionalInfo}`;
        }
        if (expected) {
            stepText += `\n   - **Expected**: ${expected}`;
        }
        return stepText;
    }).join("\n\n");
}

function isMarkdownField(fieldDef: CaseField | undefined, value: any): boolean {
    if (fieldDef) {
        const typeInfo = getFieldType(fieldDef.type_id);
        if (!typeInfo.isStructured) {
            return true;
        }
        // If string type, check if content is multi-line
        if (fieldDef.type_id === CaseFieldTypeId.String) {
            return typeof value === "string" && value.includes("\n");
        }
        return false;
    }
    // Fallback if no field schema definition is found
    return typeof value === "string" && value.includes("\n");
}

function sanitizeMetadataValue(val: any): any {
    if (Array.isArray(val)) {
        return val.map(item => (item !== null && typeof item === "object") ? (item.title || item.name || item.label || JSON.stringify(item)) : item);
    }
    return val;
}

const IGNORED_METADATA_FIELDS = new Set([
    "created_by",
    "updated_by",
    "display_order",
    "is_deleted",
    "review_status",
    "reviewer",
]);

function buildFieldDefinitionMap(caseFields: CaseField[]): Map<string, CaseField> {
    const fieldDefMap = new Map<string, CaseField>();
    for (const cf of caseFields) {
        fieldDefMap.set(cf.system_name, cf);
        if (cf.name) {
            fieldDefMap.set(cf.name, cf);
        }
        const clean = cf.system_name.replace(/^custom_/, "");
        fieldDefMap.set(clean, cf);
        if (cf.label) {
            fieldDefMap.set(cf.label, cf);
            const snakeLabel = cf.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
            fieldDefMap.set(snakeLabel, cf);
        }
    }
    return fieldDefMap;
}

function categorizeCustomFields(
    customFields: Record<string, any>,
    fieldDefMap: Map<string, CaseField>
): {
    markdownFields: Array<{ header: string; value: any; fieldDef?: CaseField }>;
    metadataFields: Array<{ key: string; value: any; fieldDef?: CaseField }>;
} {
    const markdownFields: Array<{ header: string; value: any; fieldDef?: CaseField }> = [];
    const metadataFields: Array<{ key: string; value: any; fieldDef?: CaseField }> = [];
    const seenKeys = new Set<string>();

    for (const [key, val] of Object.entries(customFields)) {
        const cleanKey = key.replace(/^custom_/, "");
        if (seenKeys.has(cleanKey) || seenKeys.has(key) || IGNORED_METADATA_FIELDS.has(cleanKey) || IGNORED_METADATA_FIELDS.has(key)) {
            continue;
        }
        if (val === null || val === undefined || val === "" || (Array.isArray(val) && val.length === 0)) {
            continue;
        }
        seenKeys.add(cleanKey);
        seenKeys.add(key);

        const fieldDef = fieldDefMap.get(key) || fieldDefMap.get(cleanKey) || fieldDefMap.get(`custom_${cleanKey}`);
        if (isMarkdownField(fieldDef, val)) {
            const header = fieldDef?.label || cleanKey.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
            markdownFields.push({ header, value: val, fieldDef });
        } else {
            metadataFields.push({ key: cleanKey, value: val, fieldDef });
        }
    }

    return { markdownFields, metadataFields };
}

function buildMarkdownBody(
    testCase: Case,
    sectionName: string,
    markdownFields: Array<{ header: string; value: any; fieldDef?: CaseField }>
): string {
    const mdLines: string[] = [];
    mdLines.push(`# [C${testCase.id}] ${sanitizeValue(testCase.title)}`);
    mdLines.push("");
    mdLines.push(`**Section**: ${sectionName}`);
    mdLines.push("");

    for (const { header, value, fieldDef } of markdownFields) {
        mdLines.push(`## ${header}`);
        if (fieldDef?.type_id === CaseFieldTypeId.Steps || (Array.isArray(value) && value[0]?.content !== undefined)) {
            mdLines.push(formatStepsSeparated(value));
        } else {
            mdLines.push(typeof value === "object" ? JSON.stringify(value, null, 2) : sanitizeValue(String(value)).trim());
        }
        mdLines.push("");
    }

    return mdLines.join("\n").trim() + "\n";
}

function buildMetadataAttributes(
    testCase: Case,
    sectionName: string,
    priority: string,
    metadataFields: Array<{ key: string; value: any; fieldDef?: CaseField }>
): Record<string, any> {
    const metadataAttributes: Record<string, any> = {
        case_id: testCase.id,
        title: testCase.title,
        section: sectionName,
        priority: priority,
    };

    if (testCase.refs) {
        metadataAttributes.references = testCase.refs;
    }

    if (testCase.labels && testCase.labels.length > 0) {
        metadataAttributes.labels = testCase.labels.map(l => l.title);
    }

    for (const { key, value, fieldDef } of metadataFields) {
        if (fieldDef?.type_id === CaseFieldTypeId.MultiSelect) {
            const listVal = Array.isArray(value) ? value : [value];
            metadataAttributes[key] = sanitizeMetadataValue(listVal.map(item => String(item)));
        } else {
            metadataAttributes[key] = sanitizeMetadataValue(value);
        }
    }

    return metadataAttributes;
}

export const exportCasesForRagTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "export_cases_for_rag",
    mode: "read",
    description: "Export test cases as formatted Markdown documents with companion JSON metadata sidecar files for Knowledge Base and RAG ingestion.",
    parameters,
    handler: async ({ case_ids, output_dir }, client) => {
        const baseDir = (process.cwd() && process.cwd() !== "/") ? process.cwd() : (process.env.PWD || os.homedir());
        const targetDir = output_dir ? path.resolve(output_dir) : path.resolve(baseDir, `rag_export_${Date.now()}`);
        await fs.promises.mkdir(targetDir, { recursive: true });

        const [priorities, caseFields] = await Promise.all([
            client.getPriorities().catch(() => []),
            client.getCaseFields().catch(() => []),
        ]);

        const fieldDefMap = buildFieldDefinitionMap(caseFields);
        const writtenFiles: string[] = [];

        for (const rawId of case_ids) {
            const id = normalizeEntityId(rawId);
            const testCase: Case = await client.getCase(id);

            let sectionName = "Unknown";
            if (testCase.section_id) {
                const section = await client.getSection(Number(testCase.section_id));
                if (section?.name) {
                    sectionName = section.name;
                }
            }

            const priority = priorities.find(p => p.id === testCase.priority_id)?.name || "Unknown";
            const customFields = processCustomFields(testCase, caseFields);
            const { markdownFields, metadataFields } = categorizeCustomFields(customFields, fieldDefMap);

            const markdownContent = buildMarkdownBody(testCase, sectionName, markdownFields);
            const metadataAttributes = buildMetadataAttributes(testCase, sectionName, priority, metadataFields);

            const docFilename = `C${testCase.id}.md`;
            const metaFilename = `C${testCase.id}.md.metadata.json`;

            await fs.promises.writeFile(path.join(targetDir, docFilename), markdownContent, "utf-8");
            await fs.promises.writeFile(path.join(targetDir, metaFilename), JSON.stringify({ metadataAttributes }, null, 2), "utf-8");

            writtenFiles.push(docFilename, metaFilename);
        }

        return {
            success: true,
            exported_count: case_ids.length,
            output_dir: targetDir,
            files: writtenFiles,
            message: `Successfully exported ${case_ids.length} test case(s) for Knowledge Base ingestion.`,
        };
    },
};

