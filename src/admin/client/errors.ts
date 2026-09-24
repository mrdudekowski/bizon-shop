export type AdminErrorCode =
  | "slug_taken"
  | "invalid_slug"
  | "publish_blocked"
  | "unsaved"
  | "media_in_use"
  | "cannot_disable_self"
  | "last_admin";

export class AdminClientError extends Error {
  constructor(readonly code: AdminErrorCode) {
    super(code);
  }
}
