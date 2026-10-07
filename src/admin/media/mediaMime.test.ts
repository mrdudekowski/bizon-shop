import { describe, expect, it } from "vitest";

import { mediaMimeFromFile } from "./mediaMime";

describe("mediaMimeFromFile", () => {
  it("maps Windows PNG labels to image/png", () => {
    expect(mediaMimeFromFile({ name: "camp.png", type: "application/octet-stream" })).toBe("image/png");
    expect(mediaMimeFromFile({ name: "camp.PNG", type: "IMAGE/PNG" })).toBe("image/png");
    expect(mediaMimeFromFile({ name: "camp.png", type: "image/x-png" })).toBe("image/png");
    expect(mediaMimeFromFile({ name: "camp.png", type: "image/png; charset=utf-8" })).toBe("image/png");
  });
});
