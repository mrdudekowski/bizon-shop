import { afterEach, describe, expect, it } from "vitest";

import { buildPublicObjectUrl } from "./publicObjectUrl";

describe("buildPublicObjectUrl", () => {
  afterEach(() => {
    delete process.env.S3_PUBLIC_URL;
    delete process.env.S3_BUCKET;
  });

  it("uses S3_PUBLIC_URL when set", () => {
    process.env.S3_PUBLIC_URL = "https://cdn.example.com";
    expect(buildPublicObjectUrl("hero.webp", "bizon/media")).toBe(
      "https://cdn.example.com/bizon/media/hero.webp",
    );
  });
});
