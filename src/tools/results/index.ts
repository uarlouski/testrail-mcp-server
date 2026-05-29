import { ToolDefinition } from "../../types/custom.js";
import { addResultsTool } from "./add_results.js";
import { addResultsForCasesTool } from "./add_results_for_cases.js";
import { getResultsTool } from "./get_results.js";

export const resultsTools: ToolDefinition<any, any>[] = [
    addResultsTool,
    addResultsForCasesTool,
    getResultsTool,
];
