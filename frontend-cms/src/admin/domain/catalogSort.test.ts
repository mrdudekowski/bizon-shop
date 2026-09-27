import { describe, expect, it } from "vitest";

import { sortModelsByPublicationStatus } from "./catalogSort";

describe("sortModelsByPublicationStatus", () => {
  it("places published models before drafts and hidden models", () => {
    const models = [
      { id: "hidden", status: "hidden" as const },
      { id: "draft", status: "draft" as const },
      { id: "site", status: "on_site" as const },
    ];

    expect(sortModelsByPublicationStatus(models).map((model) => model.id)).toEqual([
      "site",
      "draft",
      "hidden",
    ]);
  });

  it("keeps the original order within the same status", () => {
    const models = [
      { id: "second", status: "on_site" as const },
      { id: "first", status: "on_site" as const },
      { id: "draft", status: "draft" as const },
    ];

    expect(sortModelsByPublicationStatus(models).map((model) => model.id)).toEqual([
      "second",
      "first",
      "draft",
    ]);
  });
});
