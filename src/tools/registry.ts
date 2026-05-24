import { ToolDefinition } from "../types/custom.js";
import { getCaseTool } from "./get_case.js";
import { getCasesTool } from "./get_cases.js";
import { getCaseFieldsTool } from "./get_case_fields.js";
import { getTemplatesTool } from "./get_templates.js";
import { updateCaseTool } from "./update_case.js";
import { updateCasesTool } from "./update_cases.js";
import { addCaseTool } from "./add_case.js";
import { getSectionsTool } from "./get_sections.js";
import { getProjectsTool } from "./get_projects.js";
import { addRunTool } from "./add_run.js";
import { getStatusesTool } from "./get_statuses.js";
import { getPrioritiesTool } from "./get_priorities.js";
import { getTestsTool } from "./get_tests.js";
import { addResultsTool } from "./add_results.js";
import { addAttachmentToRunTool } from "./add_attachment_to_run.js";
import { addResultsForCasesTool } from "./add_results_for_cases.js";
import { getLabelsTool } from "./get_labels.js";
import { getUsersTool } from "./get_users.js";
import { getSharedStepsTool } from "./shared_steps/get_shared_steps.js";
import { getSharedStepTool } from "./shared_steps/get_shared_step.js";
import { getSharedStepHistoryTool } from "./shared_steps/get_shared_step_history.js";
import { addSharedStepTool } from "./shared_steps/add_shared_step.js";
import { updateSharedStepTool } from "./shared_steps/update_shared_step.js";
import { deleteSharedStepTool } from "./shared_steps/delete_shared_step.js";

export interface ToolRegistrationConfig {
    enableSharedSteps?: boolean;
    allowCreate?: boolean;
    allowRead?: boolean;
    allowUpdate?: boolean;
    allowDelete?: boolean;
}

export function getToolsToRegister(config: ToolRegistrationConfig): ToolDefinition<any, any>[] {
    const tools: ToolDefinition<any, any>[] = [
        getProjectsTool,
        getCaseTool,
        getCasesTool,
        getCaseFieldsTool,
        getTemplatesTool,
        getSectionsTool,
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
        tools.push(
            getSharedStepsTool as any,
            getSharedStepTool as any,
            getSharedStepHistoryTool as any,
            addSharedStepTool as any,
            updateSharedStepTool as any,
            deleteSharedStepTool as any
        );
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
