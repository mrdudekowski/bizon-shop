import { describe, expect, it } from "vitest";

import { AdminClientError } from "./errors";
import { ERROR_TEXT } from "./errorText";
import { DOCUMENT_STATUS, actionErrorText, feedbackRole } from "./actionFeedback";

describe("actionFeedback", () => {
  it("uses the catalog text for a typed admin error", () => {
    expect(actionErrorText(new AdminClientError("publish_blocked"), "Не удалось опубликовать")).toBe(
      ERROR_TEXT.publish_blocked,
    );
    expect(actionErrorText(new AdminClientError("network"), "Не удалось сохранить")).toBe(ERROR_TEXT.network);
    expect(actionErrorText(new AdminClientError("storage_unavailable"), "Не удалось сохранить")).toBe(
      ERROR_TEXT.storage_unavailable,
    );
  });

  it("keeps the action fallback for an unknown failure", () => {
    expect(actionErrorText(new Error("boom"), "Не удалось опубликовать")).toBe("Не удалось опубликовать");
  });

  it("announces publish and hide as status, failures as alerts", () => {
    expect(feedbackRole(DOCUMENT_STATUS.published)).toBe("status");
    expect(feedbackRole(DOCUMENT_STATUS.hidden)).toBe("status");
    expect(feedbackRole(DOCUMENT_STATUS.saved)).toBe("status");
    expect(feedbackRole(ERROR_TEXT.network)).toBe("alert");
    expect(feedbackRole("Не удалось опубликовать")).toBe("alert");
  });

  it("keeps infrastructure names out of editor-facing errors", () => {
    expect(ERROR_TEXT.network).toMatch(/связ/i);
    expect(ERROR_TEXT.network).not.toMatch(/S3/i);
    expect(ERROR_TEXT.storage_unavailable).toMatch(/хранилище файлов/i);
    expect(ERROR_TEXT.storage_unavailable).not.toMatch(/S3/i);
  });
});
