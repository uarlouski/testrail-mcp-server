import { ToolDefinition } from "../../types/custom.js";
import { getCaseTool } from "./get_case.js";
import { getCasesTool } from "./get_cases.js";
import { getCaseFieldsTool } from "./get_case_fields.js";
import { updateCaseTool } from "./update_case.js";
import { updateCasesTool } from "./update_cases.js";
import { addCaseTool } from "./add_case.js";
import { getCaseHistoryTool } from "./get_case_history.js";
import { resolveCaseFieldTool } from "./resolve_case_field.js";
import { exportCasesForRagTool } from "./export_cases_for_rag.js";

export { getCaseHistoryTool, resolveCaseFieldTool, exportCasesForRagTool };

export const casesTools: ToolDefinition<any, any>[] = [
    getCaseTool,
    getCasesTool,
    getCaseFieldsTool,
    updateCaseTool,
    updateCasesTool,
    addCaseTool,
    resolveCaseFieldTool,
];


