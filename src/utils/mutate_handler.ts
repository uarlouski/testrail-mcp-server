/**
 * Centralized utility to handle mutation actions (create or update) in a type-safe manner.
 * 
 * @param payload The incoming payload containing the action discriminator
 * @param onCreate Callback executed when action is "create"
 * @param onUpdate Callback executed when action is "update"
 * @returns The mutated entity wrapped in a record
 */
export async function handleMutate<
    TPayload extends { action: "create" | "update" },
    TOut = Record<string, any>
>(
    payload: TPayload,
    onCreate: (args: Extract<TPayload, { action: "create" }>) => Promise<any>,
    onUpdate: (args: Extract<TPayload, { action: "update" }>) => Promise<any>,
    schema?: { parse: (val: any) => TOut }
): Promise<TOut> {
    let result: any;
    if (payload.action === "create") {
        result = await onCreate(payload as Extract<TPayload, { action: "create" }>);
    } else if (payload.action === "update") {
        result = await onUpdate(payload as Extract<TPayload, { action: "update" }>);
    } else {
        const unknownAction = (payload as any).action;
        throw new Error(`Unsupported mutation action: ${unknownAction}`);
    }
    return schema ? schema.parse(result) : result;
}
