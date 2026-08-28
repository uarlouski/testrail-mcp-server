import { ToolDefinition } from "../types/custom.js";
import { casesTools, getCaseHistoryTool, exportCasesForRagTool } from "./cases/index.js";
import { projectsTools } from "./projects/index.js";
import { suitesTools } from "./suites/index.js";
import { sectionsTools } from "./sections/index.js";
import { runsTools } from "./runs/index.js";
import { sharedStepsTools } from "./shared_steps/index.js";
import { resultsTools } from "./results/index.js";
import { commonsTools } from "./commons/index.js";
import { attachmentsTools } from "./attachments/index.js";

export interface ToolRegistrationConfig {
    enableSharedSteps?: boolean;
    enableCaseHistory?: boolean;
    enableRagTools?: boolean;
    enableDeprecatedTools?: boolean;
    allowWrite?: boolean;
    allowRead?: boolean;
    allowDelete?: boolean;
    disabledTools?: string[];
}

export const ALL_TOOLS: ToolDefinition<any, any>[] = [
    ...projectsTools,
    ...suitesTools,
    ...casesTools,
    getCaseHistoryTool as any,
    exportCasesForRagTool as any,
    ...sectionsTools,
    ...runsTools,
    ...resultsTools,
    ...attachmentsTools,
    ...commonsTools,
    ...sharedStepsTools,
];

const ALL_TOOL_NAMES = new Set(ALL_TOOLS.map(t => t.name));

export function getToolsToRegister(config: ToolRegistrationConfig): ToolDefinition<any, any>[] {
    if (config.disabledTools && config.disabledTools.length > 0) {
        const unknownTools = config.disabledTools.filter(name => !ALL_TOOL_NAMES.has(name));
        if (unknownTools.length > 0) {
            throw new Error(`Cannot disable non-existent tool(s): ${unknownTools.join(', ')}`);
        }
    }

    const tools: ToolDefinition<any, any>[] = [
        ...projectsTools,
        ...suitesTools,
        ...casesTools,
        ...sectionsTools,
        ...runsTools,
        ...resultsTools,
        ...attachmentsTools,
        ...commonsTools,
    ];

    if (config.enableSharedSteps) {
        tools.push(...sharedStepsTools);
    }

    if (config.enableCaseHistory) {
        tools.push(getCaseHistoryTool as any);
    }

    if (config.enableRagTools) {
        tools.push(exportCasesForRagTool as any);
    }

    const allowWrite = config.allowWrite !== false;
    const allowRead = config.allowRead !== false;
    const allowDelete = config.allowDelete === true;
    const enableDeprecatedTools = config.enableDeprecatedTools !== false;
    const disabledSet = new Set(config.disabledTools ?? []);

    const filteredTools = tools.filter(tool => {
        if (disabledSet.has(tool.name)) return false;
        if (tool.deprecated && !enableDeprecatedTools) return false;
        if (tool.mode === 'write') return allowWrite;
        if (tool.mode === 'read') return allowRead;
        return allowDelete;
    });

    return filteredTools.map(tool => {
        const defaultAnnotations = {
            readOnlyHint: tool.mode === 'read',
            destructiveHint: tool.mode === 'delete',
            idempotentHint: tool.mode === 'read',
        };

        return {
            ...tool,
            annotations: {
                ...defaultAnnotations,
                ...tool.annotations,
            }
        };
    });
}
