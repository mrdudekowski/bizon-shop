import { describe, expect, it } from "vitest";

import { publishEntriesThenMark } from "./publishEntries";

describe("publishEntriesThenMark", () => {
  it("marks the package published only after every entry succeeds", async () => {
    const events: string[] = [];

    await publishEntriesThenMark(
      ["one", "two"],
      async (entry) => { events.push(`publish:${entry}`); },
      async () => { events.push("mark:published"); },
    );

    expect(events).toEqual(["publish:one", "publish:two", "mark:published"]);
  });

  it("does not mark the package published after an entry fails", async () => {
    const events: string[] = [];
    let marked = false;

    await expect(
      publishEntriesThenMark(
        ["one", "two", "three"],
        async (entry) => {
          events.push(`publish:${entry}`);
          if (entry === "two") throw new Error("entry failed");
        },
        async () => { marked = true; events.push("mark:published"); },
      ),
    ).rejects.toThrow("entry failed");

    expect(events).toEqual(["publish:one", "publish:two"]);
    expect(marked).toBe(false);
  });
});
