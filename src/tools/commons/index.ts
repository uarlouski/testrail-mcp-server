import { deleteEntityTool } from "./delete_entity.js";
import { getConfigurationsTool } from "./get_configurations.js";
import { getLabelsTool } from "./get_labels.js";
import { getPrioritiesTool } from "./get_priorities.js";
import { getStatusesTool } from "./get_statuses.js";
import { getTemplatesTool } from "./get_templates.js";
import { getTestsTool } from "./get_tests.js";
import { getUsersTool } from "./get_users.js";

export const commonsTools = [
    deleteEntityTool,
    getConfigurationsTool,
    getLabelsTool,
    getPrioritiesTool,
    getStatusesTool,
    getTemplatesTool,
    getTestsTool,
    getUsersTool,
];
