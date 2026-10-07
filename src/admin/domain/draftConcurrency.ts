import { AdminClientError } from "../client/errors";

export function assertDraftVersion(expected: unknown, current: unknown): void {
  if (expected === undefined || JSON.stringify(expected) !== JSON.stringify(current)) {
    throw new AdminClientError("conflict");
  }
}
