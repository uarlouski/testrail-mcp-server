import { z } from "zod";
import { TestRailClient } from "../../client/testrail.js";
import { ToolDefinition } from "../../types/custom.js";

const parameters = {
    entity_type: z.enum(["case", "shared_step"]).describe("The type of the entity to delete"),
    entity_id: z.number().describe("The ID of the entity to delete"),
};

export const deleteEntityTool: ToolDefinition<typeof parameters, TestRailClient> = {
    name: "delete_entity",
    mode: "delete",
    description: "Deletes a specified TestRail entity (case or shared_step) by its ID.",
    parameters,
    handler: async (args, client) => {
        const { entity_type, entity_id } = args;
        switch (entity_type) {
            case "case":
                await client.deleteCase(entity_id);
                return { message: `Case ${entity_id} deleted successfully.` };
            case "shared_step":
                await client.deleteSharedStep(entity_id);
                return { message: `Shared step ${entity_id} deleted successfully.` };
            default:
                throw new Error(`Unsupported entity type: ${entity_type}`);
        }
    }
};
