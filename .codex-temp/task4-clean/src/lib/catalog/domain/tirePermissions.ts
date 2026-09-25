import type { UserRole } from "@/access/roles";

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
