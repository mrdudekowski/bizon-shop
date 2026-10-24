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
  | "internal_error"
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

export function adminErrorStatus(code: AdminErrorCode): number {
  if (code === "forbidden") return 403;
  if (code === "conflict") return 409;
  if (code === "storage_unavailable" || code === "database_unavailable" || code === "media_cleanup_pending") return 503;
  if (code === "database_save_failed" || code === "internal_error") return 500;
  return 400;
}

export function adminCodeFromDatabaseError(error: unknown): AdminErrorCode | null {
  if (error == null || typeof error !== "object" || !("code" in error)) return null;
  const code = error.code;
  if (typeof code !== "string" || !/^[0-9A-Z]{5}$/.test(code)) return null;
  if (code.startsWith("08") || ["53300", "57P01", "57P02", "57P03", "40P01"].includes(code)) {
    return "database_unavailable";
  }
  if (code === "23502") return "database_save_failed";
  if (["23503", "23505", "23514", "23P01", "40001"].includes(code)) return "conflict";
  return null;
}

export class AdminClientError extends Error {
  constructor(readonly code: AdminErrorCode) {
    super(code);
  }
}
