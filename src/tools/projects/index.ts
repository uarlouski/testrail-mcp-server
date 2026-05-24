import { ToolDefinition } from "../../types/custom.js";
import { getProjectTool } from "./get_project.js";
import { getProjectsTool } from "./get_projects.js";

export const projectsTools: ToolDefinition<any, any>[] = [
    getProjectTool,
    getProjectsTool,
]
