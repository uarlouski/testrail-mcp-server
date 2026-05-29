import { ToolDefinition } from "../../types/custom.js";
import { queryProjectTool } from "./query_project.js";

export const projectsTools: ToolDefinition<any, any>[] = [
    queryProjectTool,
]
