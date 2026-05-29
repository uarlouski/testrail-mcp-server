import { mutateRunTool } from "./mutate_run.js";
import { queryRunTool } from "./query_run.js";
import { addAttachmentToRunTool } from "./add_attachment_to_run.js";

export const runsTools = [
    mutateRunTool,
    queryRunTool,
    addAttachmentToRunTool,
];

