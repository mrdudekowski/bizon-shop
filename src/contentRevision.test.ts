import { describe, expect, it } from "vitest";
import { publishedContentFailureDetails, readPublishedContentSnapshot } from "./contentRevision";
import type { ReadDatabase } from "./publishedRead";

describe("published content failure diagnostics", () => {
  it("keeps only a safe error class and SQLSTATE code", () => {
    const error = Object.assign(new Error("query leaked secret value"), { code: "42703" });
    expect(publishedContentFailureDetails(error)).toEqual({ errorClass: "Error", databaseCode: "42703" });
    expect(JSON.stringify(publishedContentFailureDetails(error))).not.toContain("secret");
  });

  it("bounds unexpected error metadata", () => {
    const error = Object.assign(new Error("sensitive details"), { name: "oops\nforged-log", code: "ECONNREFUSED" });
    expect(publishedContentFailureDetails(error)).toEqual({ errorClass: "unknown" });
  });
});

describe("readPublishedContentSnapshot", () => {
  it("returns the revision and all published content from one repeatable-read snapshot", async () => {
    let snapshotReads = 0;
    const database: ReadDatabase = {
      query: async () => [],
      withReadSnapshot: async (run) => {
        snapshotReads += 1;
        return run(database);
      },
    };

    const result = await readPublishedContentSnapshot(database);

    expect(snapshotReads).toBe(1);
    expect(result).toMatchObject({
      schema: 1,
      revision: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
      content: {
        home: null,
        shopHome: null,
        articles: [],
        tires: { types: [], models: [] },
        wheels: { types: [], byType: [] },
        shop: { categories: [], products: [] },
      },
    });
    expect(Object.keys(result.content.stubs)).toEqual([
      "about",
      "contact",
      "warranty",
      "branding",
      "become-a-supplier",
      "delivery-geography",
      "privacy-policy",
      "shop-delivery-returns",
    ]);
  });

  it("requires repeatable-read support", async () => {
    await expect(readPublishedContentSnapshot({ query: async () => [] }))
      .rejects.toThrow("A repeatable-read database snapshot is required");
  });
});
