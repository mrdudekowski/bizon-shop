import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const runtimeFiles = [
  new URL("./server.ts", import.meta.url),
  new URL("./publishedRead.ts", import.meta.url),
  new URL("./admin/server/adminAuth.ts", import.meta.url),
  new URL("./admin/server/postgresAdmin.ts", import.meta.url),
];

describe("runtime database code", () => {
  it("does not create, alter, or drop database schema", async () => {
    for (const file of runtimeFiles) {
      const source = await readFile(file, "utf8");
      expect(source, file.pathname).not.toMatch(/\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX|SCHEMA)\b/i);
    }
  });
});
