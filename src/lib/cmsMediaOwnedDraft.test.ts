import { describe, expect, it, vi } from "vitest";
import { restoreOwnedDraft } from "../../scripts/e2e/cms-media/restoreOwnedDraft";

describe("E2E page draft cleanup", () => {
  const original = { title: "before" };
  const owned = { title: "after test save" };

  it("retains another editor's change", async () => {
    const save = vi.fn();
    await expect(restoreOwnedDraft(original, owned, async () => ({ title: "another edit" }), save))
      .rejects.toThrow("changed in another session");
    expect(save).not.toHaveBeenCalled();
  });

  it("restores with the acknowledged save as the server's expected version", async () => {
    const save = vi.fn();
    await restoreOwnedDraft(original, owned, async () => ({ ...owned }), save);
    expect(save).toHaveBeenCalledExactlyOnceWith(original, owned);
    expect(save.mock.calls[0][1]).toBe(owned);
  });

  it("skips writing if the original draft is already present", async () => {
    const save = vi.fn();
    await restoreOwnedDraft(original, owned, async () => ({ ...original }), save);
    expect(save).not.toHaveBeenCalled();
  });
});
