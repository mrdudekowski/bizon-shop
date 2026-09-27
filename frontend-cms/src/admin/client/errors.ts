export type AdminErrorCode =
  | "slug_taken"
  | "invalid_slug"
  | "publish_blocked"
  | "category_not_published"
  | "category_has_published_products"
  | "unsaved"
  | "media_in_use"
  | "storage_unavailable"
  | "cannot_disable_self"
  | "last_admin"
  | "invalid_credentials"
  | "unauthorized"
  | "forbidden";

export class AdminClientError extends Error {
  constructor(readonly code: AdminErrorCode) {
    super(code);
  }
}
