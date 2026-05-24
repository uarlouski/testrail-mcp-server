import { ToolDefinition } from "../../types/custom.js";
import { getSharedStepsTool } from "./get_shared_steps.js";
import { getSharedStepTool } from "./get_shared_step.js";
import { getSharedStepHistoryTool } from "./get_shared_step_history.js";
import { addSharedStepTool } from "./add_shared_step.js";
import { updateSharedStepTool } from "./update_shared_step.js";
import { deleteSharedStepTool } from "./delete_shared_step.js";

export const sharedStepsTools: ToolDefinition<any, any>[] = [
    getSharedStepsTool as any,
    getSharedStepTool as any,
    getSharedStepHistoryTool as any,
    addSharedStepTool as any,
    updateSharedStepTool as any,
    deleteSharedStepTool as any
];
