import { ToolDefinition } from "../../types/custom.js";
import { getSectionsTool } from "./get_sections.js";
import { mutateSectionTool } from "./mutate_section.js";

export const sectionsTools: ToolDefinition<any, any>[] = [
    getSectionsTool,
    mutateSectionTool,
];
