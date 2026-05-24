import { ToolDefinition } from "../../types/custom.js";
import { getSectionsTool } from "./get_sections.js";
import { addSectionTool } from "./add_section.js";

export const sectionsTools: ToolDefinition<any, any>[] = [
    getSectionsTool,
    addSectionTool,
];
