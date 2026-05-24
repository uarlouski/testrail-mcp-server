import { ToolDefinition } from "../types/custom.js";
import { getCaseTool } from "./get_case.js";
import { getCasesTool } from "./get_cases.js";
import { getCaseFieldsTool } from "./get_case_fields.js";
import { getTemplatesTool } from "./get_templates.js";
import { updateCaseTool } from "./update_case.js";
import { updateCasesTool } from "./update_cases.js";
import { addCaseTool } from "./add_case.js";
import { projectsTools } from "./projects/index.js";
import { sectionsTools } from "./sections/index.js";
import { addRunTool } from "./add_run.js";
import { getStatusesTool } from "./get_statuses.js";
import { getPrioritiesTool } from "./get_priorities.js";
import { getTestsTool } from "./get_tests.js";
import { addResultsTool } from "./add_results.js";
import { addAttachmentToRunTool } from "./add_attachment_to_run.js";
import { addResultsForCasesTool } from "./add_results_for_cases.js";
import { getLabelsTool } from "./get_labels.js";
import { getUsersTool } from "./get_users.js";
import { sharedStepsTools } from "./shared_steps/index.js";


export interface ToolRegistrationConfig {
    enableSharedSteps?: boolean;
    allowCreate?: boolean;
    allowRead?: boolean;
    allowUpdate?: boolean;
    allowDelete?: boolean;
}

export function getToolsToRegister(config: ToolRegistrationConfig): ToolDefinition<any, any>[] {
    const tools: ToolDefinition<any, any>[] = [
        ...projectsTools,
        getCaseTool,
        getCasesTool,
        getCaseFieldsTool,
        getTemplatesTool,
        ...sectionsTools,
        updateCaseTool,
        updateCasesTool,
        addCaseTool,
        addRunTool,
        getStatusesTool,
        getPrioritiesTool,
        getTestsTool,
        addResultsTool,
        addResultsForCasesTool,
        addAttachmentToRunTool,
        getLabelsTool,
        getUsersTool,
    ];

    if (config.enableSharedSteps) {
        tools.push(...sharedStepsTools);
    }

    const allowCreate = config.allowCreate !== false;
    const allowRead = config.allowRead !== false;
    const allowUpdate = config.allowUpdate !== false;
    const allowDelete = config.allowDelete === true;

    return tools.filter(tool => {
        if (tool.mode === 'create') return allowCreate;
        if (tool.mode === 'read') return allowRead;
        if (tool.mode === 'update') return allowUpdate;
        return allowDelete;
    });
}
