import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { normalizeEntityId, sanitizeValue } from "../../utils/sanitizer.js";
import { resolveCustomFieldValue } from "../../utils/mapper.js";
import { getBaseDirectory } from "../../utils/fs.js";
import { TestRailClient } from "../../client/testrail.js";
import { ToolDefinition } from "../../types/custom.js";
import { Case, CaseField } from "./types.js";
import { CaseFieldTypeId, getFieldType } from "./fields.js";

const parameters = {
    case_ids: z.array(z.union([z.string(), z.number()])).min(1).describe("List of test case IDs (e.g. ['C123', 456])"),
    output_dir: z.string().optional().describe("Directory to save exported files. Defaults to an auto-generated directory in the current working directory."),
    ignored_fields: z.array(z.string()).optional().describe("Optional list of custom field names or system names to ignore/exclude from export (e.g. ['custom_review_status', 'review_status']). Supports both full system_name and stripped field names. Core metadata attributes (case_id, title, section, priority, references, labels) cannot be ignored."),
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
    if (typeof val === "boolean") {
        return String(val);
    }

    if (Array.isArray(val)) {
        return val.map(item => {
            if (item !== null && typeof item === "object") {
                return item.title || item.name || item.label || JSON.stringify(item);
            }
            return String(item);
        });
    }

    return val;
}

const IGNORED_METADATA_FIELDS = new Set([
    "created_by",
    "updated_by",
    "display_order",
    "is_deleted",
]);

function buildFieldDefinitionMap(caseFields: CaseField[]): Map<string, CaseField> {
    const fieldDefMap = new Map<string, CaseField>();
    for (const cf of caseFields) {
        fieldDefMap.set(cf.system_name, cf);
    }
    return fieldDefMap;
}

function categorizeCustomFields(
    testCase: Case,
    applicableFieldDefs: CaseField[],
    ignoredFieldsSet: Set<string>
): {
    markdownFields: Array<{ header: string; value: any; fieldDef?: CaseField }>;
    metadataFields: Array<{ key: string; value: any; fieldDef?: CaseField }>;
} {
    const markdownFields: Array<{ header: string; value: any; fieldDef?: CaseField }> = [];
    const metadataFields: Array<{ key: string; value: any; fieldDef?: CaseField }> = [];
    const fieldDefMap = buildFieldDefinitionMap(applicableFieldDefs);

    for (const [systemName, rawValue] of Object.entries(testCase)) {
        if (!systemName.startsWith("custom_")) {
            continue;
        }
        if (rawValue === null || rawValue === undefined || rawValue === "" || (Array.isArray(rawValue) && rawValue.length === 0)) {
            continue;
        }
        const strippedName = systemName.replace(/^custom_/, "");
        if (ignoredFieldsSet.has(systemName) || ignoredFieldsSet.has(strippedName)) {
            continue;
        }

        const fieldDef = fieldDefMap.get(systemName);
        if (!fieldDef) {
            continue;
        }

        const val = resolveCustomFieldValue(fieldDef, rawValue);

        if (isMarkdownField(fieldDef, val)) {
            const header = fieldDef.label || systemName.replace(/^custom_/, "");
            markdownFields.push({ header, value: val, fieldDef });
        } else {
            const metaKey = fieldDef.name || systemName.replace(/^custom_/, "");
            metadataFields.push({ key: metaKey, value: val, fieldDef });
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
    description: "Export test cases as formatted Markdown documents with companion JSON metadata sidecar files for Knowledge Base and RAG ingestion. If exporting more than 25 cases, batch them into chunks of ~25 and execute in parallel with a shared output_dir to prevent tool call timeouts.",
    parameters,
    handler: async ({ case_ids, output_dir, ignored_fields }, client) => {
        const baseDir = getBaseDirectory();
        const targetDir = output_dir
            ? (path.isAbsolute(output_dir) ? output_dir : path.resolve(baseDir, output_dir))
            : path.resolve(baseDir, `rag_export_${Date.now()}`);
        await fs.promises.mkdir(targetDir, { recursive: true });

        const ignoredFieldsSet = new Set<string>(IGNORED_METADATA_FIELDS);
        if (ignored_fields) {
            for (const field of ignored_fields) {
                ignoredFieldsSet.add(field);
                if (field.startsWith("custom_")) {
                    ignoredFieldsSet.add(field.replace(/^custom_/, ""));
                } else {
                    ignoredFieldsSet.add(`custom_${field}`);
                }
            }
        }

        const [priorities, caseFields] = await Promise.all([
            client.getPriorities().catch(() => []),
            client.getCaseFields().catch(() => []),
        ]);

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
            const templateId = testCase.template_id;
            const applicableFields = caseFields.filter(field =>
                field.include_all || (templateId !== null && templateId !== undefined && field.template_ids.includes(templateId))
            );
            const { markdownFields, metadataFields } = categorizeCustomFields(testCase, applicableFields, ignoredFieldsSet);

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
