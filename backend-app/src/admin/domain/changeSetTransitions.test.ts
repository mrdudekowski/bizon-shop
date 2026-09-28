import { describe, expect, it } from "vitest";

import {
  assertCanCancelChangeSet,
  assertCanPublishChangeSet,
  assertCanReturnChangeSet,
  assertCanSubmitChangeSet,
} from "./changeSetTransitions";
import { AdminClientError } from "../client/errors";
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
    entries: [
      {
        id: "entry-1",
        entityType: "tire-model",
        entityId: "model-1",
        entityTitle: "LH01",
        operation: "update",
        fieldChanges: [
          {
            path: "name",
            location: { section: "Шины", document: "LH01", tab: "Карточка", field: "Название" },
            before: { kind: "text", value: "A" },
            after: { kind: "text", value: "B" },
          },
        ],
        rollbackDraft: { name: "A" },
      },
    ],
    ...overrides,
  };
}

describe("changeSetTransitions", () => {
  it("lets the author submit a non-empty open or returned pack", () => {
    expect(() => assertCanSubmitChangeSet(pack({}), "user-editor")).not.toThrow();
    expect(() => assertCanSubmitChangeSet(pack({ status: "returned" }), "user-editor")).not.toThrow();
  });

  it("rejects submitting someone else's or an empty pack", () => {
    expect(() => assertCanSubmitChangeSet(pack({}), "other")).toThrow(AdminClientError);
    expect(() => assertCanSubmitChangeSet(pack({ entries: [] }), "user-editor")).toThrowError(
      expect.objectContaining({ code: "changeset_not_pending" }),
    );
  });

  it("only reviews packs that are pending", () => {
    expect(() => assertCanPublishChangeSet(pack({}))).toThrowError(expect.objectContaining({ code: "changeset_not_pending" }));
    expect(() => assertCanReturnChangeSet(pack({ status: "pending_review" }), "нужно фото")).not.toThrow();
    expect(() => assertCanReturnChangeSet(pack({ status: "pending_review" }), "   ")).toThrowError(
      expect.objectContaining({ code: "review_comment_required" }),
    );
    expect(() => assertCanCancelChangeSet(pack({ status: "pending_review" }))).not.toThrow();
    expect(() => assertCanPublishChangeSet(pack({ status: "published" }))).toThrowError(
      expect.objectContaining({ code: "changeset_not_pending" }),
    );
  });
});
