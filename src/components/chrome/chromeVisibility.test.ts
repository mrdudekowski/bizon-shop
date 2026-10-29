import { describe, expect, it } from "vitest";

import { nextChromeVisibility } from "./chromeVisibility";

describe("nextChromeVisibility", () => {
  it("hides after a downward move and shows after an upward move on mobile", () => {
    expect(nextChromeVisibility("shown", 40, 20, true)).toBe("hidden");
    expect(nextChromeVisibility("hidden", 20, 40, true)).toBe("shown");
  });

  it("ignores a nudge smaller than 8px and stays shown at the top", () => {
    expect(nextChromeVisibility("shown", 30, 24, true)).toBe("shown");
    expect(nextChromeVisibility("hidden", 0, 40, true)).toBe("shown");
  });

  it("stays shown on desktop", () => {
    expect(nextChromeVisibility("shown", 200, 20, false)).toBe("shown");
  });
});
