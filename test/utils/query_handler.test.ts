import { jest } from '@jest/globals';
import { handleQuery } from "../../src/utils/query_handler.js";

describe("handleQuery", () => {
    it("should invoke onQueryOne when action is 'one'", async () => {
        const payload = { action: "one" as const, id: 42 };
        const onQueryOne = jest.fn(async (p: typeof payload) => ({ result: "one", id: p.id }));
        const onQueryMany = jest.fn(async () => ({ result: "many" }));

        const result = await handleQuery(payload, onQueryOne, onQueryMany);

        expect(result).toEqual({ result: "one", id: 42 });
        expect(onQueryOne).toHaveBeenCalledWith(payload);
        expect(onQueryMany).not.toHaveBeenCalled();
    });

    it("should invoke onQueryMany when action is 'many'", async () => {
        const payload = { action: "many" as const, filter: "all" };
        const onQueryOne = jest.fn(async () => ({ result: "one" }));
        const onQueryMany = jest.fn(async (p: typeof payload) => ({ result: "many", filter: p.filter }));

        const result = await handleQuery(payload, onQueryOne, onQueryMany);

        expect(result).toEqual({ result: "many", filter: "all" });
        expect(onQueryMany).toHaveBeenCalledWith(payload);
        expect(onQueryOne).not.toHaveBeenCalled();
    });

    it("should throw an error for unsupported query actions", async () => {
        const payload = { action: "unsupported" as any };
        const onQueryOne = jest.fn(async () => ({}));
        const onQueryMany = jest.fn(async () => ({}));

        await expect(handleQuery(payload, onQueryOne, onQueryMany))
            .rejects.toThrow("Unsupported query action: unsupported");
    });
});
