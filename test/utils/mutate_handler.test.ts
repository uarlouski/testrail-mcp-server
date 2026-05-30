import { jest, describe, it, expect } from '@jest/globals';
import { handleMutate } from "../../src/utils/mutate_handler.js";

describe("handleMutate", () => {
    it("should invoke onCreate when action is 'create'", async () => {
        const payload = { action: "create" as const, name: "New entity" };
        const onCreate = jest.fn(async (p: typeof payload) => ({ result: "created", name: p.name }));
        const onUpdate = jest.fn(async () => ({ result: "updated" }));

        const result = await handleMutate(payload, onCreate, onUpdate);

        expect(result).toEqual({ result: "created", name: "New entity" });
        expect(onCreate).toHaveBeenCalledWith(payload);
        expect(onUpdate).not.toHaveBeenCalled();
    });

    it("should invoke onUpdate when action is 'update'", async () => {
        const payload = { action: "update" as const, id: 123, name: "Updated entity" };
        const onCreate = jest.fn(async () => ({ result: "created" }));
        const onUpdate = jest.fn(async (p: typeof payload) => ({ result: "updated", id: p.id, name: p.name }));

        const result = await handleMutate(payload, onCreate, onUpdate);

        expect(result).toEqual({ result: "updated", id: 123, name: "Updated entity" });
        expect(onUpdate).toHaveBeenCalledWith(payload);
        expect(onCreate).not.toHaveBeenCalled();
    });

    it("should parse the result with the provided schema", async () => {
        const payload = { action: "create" as const, name: "New entity" };
        const onCreate = jest.fn(async () => ({ result: "created", name: "New entity" }));
        const onUpdate = jest.fn(async () => ({}));
        
        const mockSchema = {
            parse: jest.fn((val: any) => ({ ...val, parsed: true }))
        };

        const result = await handleMutate(payload, onCreate, onUpdate, mockSchema);

        expect(result).toEqual({ result: "created", name: "New entity", parsed: true });
        expect(mockSchema.parse).toHaveBeenCalledWith({ result: "created", name: "New entity" });
    });

    it("should throw an error for unsupported mutation actions", async () => {
        const payload = { action: "delete" as any };
        const onCreate = jest.fn(async () => ({}));
        const onUpdate = jest.fn(async () => ({}));

        await expect(handleMutate(payload, onCreate, onUpdate))
            .rejects.toThrow("Unsupported mutation action: delete");
    });
});
