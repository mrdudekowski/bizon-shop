import { describe, expect, it } from "vitest";

import { shopCampaignFrames } from "./shopCampaignFrames";

describe("shopCampaignFrames", () => {
  it("uses the uploaded frame list and drops empty urls", () => {
    expect(shopCampaignFrames({
      imageUrl: "/old.png",
      imageAlt: "old",
      frames: [
        { imageUrl: " /a.png ", imageAlt: "A" },
        { imageUrl: "  " },
        { imageUrl: "/b.png", imageAlt: "B", imageFocalX: 0.2, imageFocalY: 0.8 },
      ],
    })).toEqual([
      { imageUrl: "/a.png", imageAlt: "A" },
      { imageUrl: "/b.png", imageAlt: "B", imageFocalX: 0.2, imageFocalY: 0.8 },
    ]);
  });

  it("falls back to the single campaign image when no frames were saved", () => {
    expect(shopCampaignFrames({ imageUrl: "/solo.png", imageAlt: "Solo", imageFocalX: 0.4 })).toEqual([
      { imageUrl: "/solo.png", imageAlt: "Solo", imageFocalX: 0.4 },
    ]);
  });
});
