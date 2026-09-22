import { ToolDefinition } from "../../types/custom.js";
import { querySectionTool } from "./query_section.js";
import { mutateSectionTool } from "./mutate_section.js";

export const sectionsTools: ToolDefinition<any, any>[] = [
    querySectionTool,
    mutateSectionTool,
];

export { querySectionTool, mutateSectionTool };

