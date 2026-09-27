import { describe, expect, it } from "vitest";
import { hydrateMissingImageAssetIds } from "./hydrateWheelPreviewAssets";

describe("hydrateMissingImageAssetIds", () => {
  it("loads only missing image IDs from the catalog record", async () => {
    const requested: string[] = [];
    const result = await hydrateMissingImageAssetIds(
      [
        { id: "wheel-with-image", imageAssetId: "media-1" },
        { id: "wheel-with-missing-list-image", imageAssetId: null },
      ],
      async (id) => {
        requested.push(id);
        return { draft: { mainImage: { assetId: "media-2" } } };
      },
    );

    expect(requested).toEqual(["wheel-with-missing-list-image"]);
    expect(result.map((item) => item.imageAssetId)).toEqual(["media-1", "media-2"]);
  });

  it("keeps the card usable when a detail record has no main photo", async () => {
    const result = await hydrateMissingImageAssetIds(
      [{ id: "wheel-without-image", imageAssetId: null }],
      async () => ({ draft: {} }),
    );

    expect(result[0].imageAssetId).toBeNull();
  });
});
