export type AdminErrorCode =
  | "slug_taken"
  | "invalid_slug"
  | "not_found"
  | "publish_blocked"
  | "category_not_published"
  | "category_has_published_products"
  | "unsaved"
  | "media_in_use"
  | "media_cleanup_pending"
  | "media_storage_key_missing"
  | "storage_unavailable"
  | "database_unavailable"
  | "database_save_failed"
  | "network"
  | "cannot_disable_self"
  | "cannot_reset_self"
  | "password_too_short"
  | "user_not_found"
  | "last_admin"
  | "invalid_credentials"
  | "unauthorized"
  | "forbidden"
  | "pending_review_exists"
  | "changeset_not_pending"
  | "review_comment_required"
  | "conflict";

export class AdminClientError extends Error {
  constructor(readonly code: AdminErrorCode) {
    super(code);
  }
}
