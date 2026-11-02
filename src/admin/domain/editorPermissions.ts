import type { AdminSession } from "./types";

export type EditorAction =
  | "edit_catalog"
  | "create_catalog_items"
  | "edit_site_pages"
  | "create_catalog_structure"
  | "publish"
  | "hide"
  | "delete"
  | "manage_users"
  | "review_queue"
  | "view_requests"
  | "manage_requests";

export function canEditorPerform(session: AdminSession, action: EditorAction): boolean {
  if (session.role === "admin") return true;
  if (session.role === "sales_manager") return action === "view_requests" || action === "manage_requests";
  if (session.role !== "editor") return false;
  if (action === "edit_catalog") return true;
  if (action === "create_catalog_items") return session.capabilities.includes("create_catalog_items");
  if (action === "edit_site_pages") return session.capabilities.includes("edit_site_pages");
  return false;
}
