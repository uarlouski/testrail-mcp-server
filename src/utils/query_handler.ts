/**
 * Centralized utility to handle query actions (one or many) in a type-safe manner.
 * 
 * @param payload The incoming payload containing the action discriminator
 * @param onQueryOne Callback executed when action is "one"
 * @param onQueryMany Callback executed when action is "many"
 * @returns The queried entity or list of entities wrapped in a record
 */
export async function handleQuery<
    TPayload extends { action: "one" | "many" }
>(
    payload: TPayload,
    onQueryOne: (args: Extract<TPayload, { action: "one" }>) => Promise<Record<string, any>>,
    onQueryMany: (args: Extract<TPayload, { action: "many" }>) => Promise<Record<string, any>>
): Promise<Record<string, any>> {
    if (payload.action === "one") {
        return onQueryOne(payload as Extract<TPayload, { action: "one" }>);
    } else if (payload.action === "many") {
        return onQueryMany(payload as Extract<TPayload, { action: "many" }>);
    } else {
        const unknownAction = (payload as any).action;
        throw new Error(`Unsupported query action: ${unknownAction}`);
    }
}
