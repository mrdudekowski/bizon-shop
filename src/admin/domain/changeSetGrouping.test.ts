import { describe, expect, it } from "vitest";

import { CHANGESET_IDLE_MS, resolveOpenChangeSet } from "./changeSetGrouping";
import type { ChangeSet } from "./types";

function pack(overrides: Partial<ChangeSet>): ChangeSet {
  return {
    id: "cs-1",
    authorUserId: "user-editor",
    authorLogin: "editor",
    status: "open",
    createdAt: "2026-09-28T10:00:00.000Z",
    updatedAt: "2026-09-28T10:00:00.000Z",
    submittedAt: null,
    reviewedAt: null,
    reviewedByLogin: null,
    reviewComment: null,
    entries: [],
    ...overrides,
  };
}

describe("resolveOpenChangeSet", () => {
  it("reuses the author's open pack inside the 30-minute window", () => {
    const existing = [pack({ id: "keep", updatedAt: "2026-09-28T10:00:00.000Z" })];
    const now = new Date("2026-09-28T10:12:00.000Z").getTime();
    expect(resolveOpenChangeSet({ existing, authorUserId: "user-editor", now })?.id).toBe("keep");
  });

  it("opens a new pack after 30 idle minutes", () => {
    const existing = [pack({ updatedAt: "2026-09-28T10:00:00.000Z" })];
    const now = new Date("2026-09-28T10:00:00.000Z").getTime() + CHANGESET_IDLE_MS;
    expect(resolveOpenChangeSet({ existing, authorUserId: "user-editor", now })).toBeNull();
  });

  it("reuses a returned pack and ignores another author's open pack", () => {
    const existing = [
      pack({ id: "theirs", authorUserId: "other", updatedAt: "2026-09-28T10:10:00.000Z" }),
      pack({ id: "mine", status: "returned", updatedAt: "2026-09-28T10:10:00.000Z" }),
    ];
    const now = new Date("2026-09-28T10:20:00.000Z").getTime();
    expect(resolveOpenChangeSet({ existing, authorUserId: "user-editor", now })?.id).toBe("mine");
  });

  it("does not reuse a pack already sent for review", () => {
    const existing = [pack({ status: "pending_review", updatedAt: "2026-09-28T10:10:00.000Z" })];
    const now = new Date("2026-09-28T10:12:00.000Z").getTime();
    expect(resolveOpenChangeSet({ existing, authorUserId: "user-editor", now })).toBeNull();
  });
});
