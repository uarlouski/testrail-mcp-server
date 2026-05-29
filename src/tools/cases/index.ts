import { ToolDefinition } from "../../types/custom.js";
import { getCaseTool } from "./get_case.js";
import { getCasesTool } from "./get_cases.js";
import { getCaseFieldsTool } from "./get_case_fields.js";
import { updateCaseTool } from "./update_case.js";
import { updateCasesTool } from "./update_cases.js";
import { addCaseTool } from "./add_case.js";

export const casesTools: ToolDefinition<any, any>[] = [
    getCaseTool,
    getCasesTool,
    getCaseFieldsTool,
    updateCaseTool,
    updateCasesTool,
    addCaseTool,
];
