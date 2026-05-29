import { ToolDefinition } from "../types/custom.js";
import { casesTools } from "./cases/index.js";
import { projectsTools } from "./projects/index.js";
import { suitesTools } from "./suites/index.js";
import { sectionsTools } from "./sections/index.js";
import { runsTools } from "./runs/index.js";
import { sharedStepsTools } from "./shared_steps/index.js";
import { resultsTools } from "./results/index.js";
import { commonsTools } from "./commons/index.js";

export interface ToolRegistrationConfig {
    enableSharedSteps?: boolean;
    allowWrite?: boolean;
    allowRead?: boolean;
    allowDelete?: boolean;
}

export function getToolsToRegister(config: ToolRegistrationConfig): ToolDefinition<any, any>[] {
    const tools: ToolDefinition<any, any>[] = [
        ...projectsTools,
        ...suitesTools,
        ...casesTools,
        ...sectionsTools,
        ...runsTools,
        ...resultsTools,
        ...commonsTools,
    ];

    if (config.enableSharedSteps) {
        tools.push(...sharedStepsTools);
    }

    const allowWrite = config.allowWrite !== false;
    const allowRead = config.allowRead !== false;
    const allowDelete = config.allowDelete === true;

    return tools.filter(tool => {
        if (tool.mode === 'write') return allowWrite;
        if (tool.mode === 'read') return allowRead;
        return allowDelete;
    });
}
