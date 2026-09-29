import { AdminClientError } from "../client/errors";
import { canEditorPerform, type EditorAction } from "./editorPermissions";
import { createChangeSet, mergeChangeEntry, resolveOpenChangeSet } from "./changeSetGrouping";
import { diffDraft } from "./draftDiff";
import type {
  AdminSession,
  AdminUser,
  ChangeSet,
  MediaAsset,
  StatusEntity,
} from "./types";

export type ChangeSetState = {
  session: AdminSession;
  users: AdminUser[];
  changeSets: ChangeSet[];
  assets: MediaAsset[];
};

export function actorSession(state: ChangeSetState): AdminSession {
  const user = state.users.find((item) => item.login === state.session.login);
  return {
    login: state.session.login,
    role: user?.role ?? state.session.role,
    capabilities: user?.capabilities ?? state.session.capabilities ?? [],
  };
}

export function currentUser(state: ChangeSetState): AdminUser {
  const user = state.users.find((item) => item.login === state.session.login);
  if (user == null) throw new AdminClientError("unauthorized");
  return user;
}

export function requirePermission(state: ChangeSetState, action: EditorAction): void {
  if (!canEditorPerform(actorSession(state), action)) throw new AdminClientError("forbidden");
}

const OPEN_STATUSES = new Set(["open", "returned", "pending_review"]);

export function activeLock(
  packs: ChangeSet[],
  entityType: StatusEntity,
  entityId: string,
): ChangeSet | null {
  return (
    packs.find(
      (pack) =>
        OPEN_STATUSES.has(pack.status) &&
        pack.entries.some((entry) => entry.entityType === entityType && entry.entityId === entityId),
    ) ?? null
  );
}

export function cancelOverlappingPacks(
  state: ChangeSetState,
  entityType: StatusEntity,
  entityId: string,
  now: Date,
  reviewerLogin: string,
): void {
  state.changeSets = state.changeSets.map((pack) => {
    if (!OPEN_STATUSES.has(pack.status)) return pack;
    if (!pack.entries.some((entry) => entry.entityType === entityType && entry.entityId === entityId)) return pack;
    return {
      ...pack,
      status: "cancelled",
      reviewedAt: now.toISOString(),
      reviewedByLogin: reviewerLogin,
      reviewComment: "Администратор опубликовал карточку напрямую",
    };
  });
}

export function recordEditorMutation(
  state: ChangeSetState,
  input: {
    entityType: StatusEntity;
    entityId: string;
    entityTitle: string;
    operation: "create" | "update";
    before: unknown;
    after: unknown;
    now?: Date;
  },
): void {
  const session = actorSession(state);
  if (session.role !== "editor") return;
  const user = currentUser(state);
  const lock = activeLock(state.changeSets, input.entityType, input.entityId);
  if (lock != null && lock.authorUserId !== user.id) throw new AdminClientError("pending_review_exists");
  if (lock?.status === "pending_review") throw new AdminClientError("pending_review_exists");

  const changes = diffDraft(input.before, input.after, input.entityType, state.assets);
  if (changes.length === 0 && input.operation !== "create") return;

  const now = input.now ?? new Date();
  const open = resolveOpenChangeSet({ existing: state.changeSets, authorUserId: user.id, now: now.getTime() });
  const pack = open ?? createChangeSet({ id: user.id, login: user.login }, now);
  const existingEntry = pack.entries.find((entry) => entry.entityType === input.entityType && entry.entityId === input.entityId);
  const next = mergeChangeEntry(
    pack,
    {
      id: existingEntry?.id ?? crypto.randomUUID(),
      entityType: input.entityType,
      entityId: input.entityId,
      entityTitle: input.entityTitle,
      operation: existingEntry?.operation === "create" ? "create" : input.operation,
      fieldChanges: changes,
      rollbackDraft: existingEntry?.rollbackDraft ?? input.before,
    },
    now,
  );
  if (open == null) state.changeSets = [...state.changeSets, next];
  else state.changeSets = state.changeSets.map((item) => (item.id === pack.id ? next : item));
}
