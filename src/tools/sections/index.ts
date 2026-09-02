import { ToolDefinition } from "../../types/custom.js";
import { getSectionsTool } from "./get_sections.js";
import { querySectionTool } from "./query_section.js";
import { mutateSectionTool } from "./mutate_section.js";

export const sectionsTools: ToolDefinition<any, any>[] = [
    querySectionTool,
    getSectionsTool,
    mutateSectionTool,
];

export { getSectionsTool, querySectionTool, mutateSectionTool };

