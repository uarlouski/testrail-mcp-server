import { describe, it, expect } from "@jest/globals";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { VERSION } from "../src/version.js";

describe("VERSION", () => {
    it("matches package.json version", () => {
        const packageJsonPath = join(dirname(fileURLToPath(import.meta.url)), "..", "package.json");
        const { version } = JSON.parse(readFileSync(packageJsonPath, "utf8"));

        expect(VERSION).toBe(version);
    });
});
