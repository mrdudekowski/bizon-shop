import { describe, expect, it } from "vitest";
import { collectPendingMediaReplacements } from "./mediaReplacement";

describe("collectPendingMediaReplacements", () => {
  it("finds staged image replacements throughout a saved content draft", () => {
    expect(collectPendingMediaReplacements({
      mainImage: { assetId: "12", replacementAssetId: "90" },
      gallery: [
        { assetId: "13", alt: "old" },
        { assetId: "14", replacementAssetId: "91" },
      ],
    })).toEqual([
      { targetMediaId: "12", stagedMediaId: "90" },
      { targetMediaId: "14", stagedMediaId: "91" },
    ]);
  });

  it("uses one current replacement when the same asset appears more than once", () => {
    expect(collectPendingMediaReplacements({
      first: { assetId: "12", replacementAssetId: "90" },
      second: { assetId: "12", replacementAssetId: "91" },
    })).toEqual([{ targetMediaId: "12", stagedMediaId: "90" }]);
  });
});
