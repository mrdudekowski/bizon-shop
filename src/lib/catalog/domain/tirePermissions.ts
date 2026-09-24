export type UserRole = "admin" | "content_manager" | "sales_manager" | "viewer";

import type { VerificationStatus } from "./tireCatalog";

export function canSetTireVerificationStatus(
  role: UserRole | null,
  nextStatus: VerificationStatus,
): boolean {
  if (nextStatus === "imported" || nextStatus === "needsReview") {
    return true;
  }
  return role === "admin" || role === "content_manager";
}
