import { AdminClientError } from "@/admin/client/errors";
import type { ChangeSet } from "./types";

function hasChanges(pack: ChangeSet): boolean {
  return pack.entries.some((entry) => entry.fieldChanges.length > 0);
}

export function assertCanSubmitChangeSet(pack: ChangeSet, authorUserId: string): void {
  if (pack.authorUserId !== authorUserId) throw new AdminClientError("forbidden");
  if (pack.status !== "open" && pack.status !== "returned") throw new AdminClientError("changeset_not_pending");
  if (!hasChanges(pack)) throw new AdminClientError("changeset_not_pending");
}

export function assertCanPublishChangeSet(pack: ChangeSet): void {
  if (pack.status !== "pending_review") throw new AdminClientError("changeset_not_pending");
}

export function assertCanCancelChangeSet(pack: ChangeSet): void {
  if (pack.status !== "pending_review") throw new AdminClientError("changeset_not_pending");
}

export function assertCanReturnChangeSet(pack: ChangeSet, comment: string): void {
  if (pack.status !== "pending_review") throw new AdminClientError("changeset_not_pending");
  if (comment.trim().length === 0) throw new AdminClientError("review_comment_required");
}
