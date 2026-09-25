import { beforeEach, describe, expect, it, vi } from "vitest";

const { findPublished, findPublishedBySlug } = vi.hoisted(() => ({
  findPublished: vi.fn(),
  findPublishedBySlug: vi.fn(),
}));

vi.mock("./payload/query", () => ({
  findPublished,
  findPublishedBySlug,
}));

import { getTireModelsByTypeSlug } from "./getTireModels";

describe("getTireModelsByTypeSlug", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("omits models without published variants", async () => {
    findPublishedBySlug.mockResolvedValue({ id: 10, slug: "tbr" });
    findPublished
      .mockResolvedValueOnce([
        {
          id: 1,
          slug: "with-sizes",
          name: "With sizes",
          tireType: { id: 10, slug: "tbr", name: "TBR" },
        },
        {
          id: 2,
          slug: "without-sizes",
          name: "Without sizes",
          tireType: { id: 10, slug: "tbr", name: "TBR" },
        },
      ])
      .mockResolvedValueOnce([{ id: 101 }])
      .mockResolvedValueOnce([]);

    const models = await getTireModelsByTypeSlug("tbr");

    expect(models.map((model) => model.slug)).toEqual(["with-sizes"]);
    expect(findPublished).toHaveBeenNthCalledWith(
      2,
      "tire-variants",
      expect.objectContaining({
        where: { tireModel: { equals: "1" } },
        limit: 1,
      }),
    );
    expect(findPublished).toHaveBeenNthCalledWith(
      3,
      "tire-variants",
      expect.objectContaining({
        where: { tireModel: { equals: "2" } },
        limit: 1,
      }),
    );
  });
});
