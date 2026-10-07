import { describe, expect, it } from "vitest";
import { createContentRevision, createRequestLogRecord } from "./requestTelemetry";

describe("request telemetry", () => {
  it("creates a short content revision without exposing the content", () => {
    const revision = createContentRevision('{"name":"Published item"}');

    expect(revision).toHaveLength(16);
    expect(createContentRevision('{"name":"Published item"}')).toBe(revision);
    expect(createContentRevision('{"name":"Updated item"}')).not.toBe(revision);
    expect(revision).not.toContain("Published item");
  });

  it("keeps a safe path and excludes query values from the log", () => {
    const record = createRequestLogRecord({
      method: "GET",
      url: "/v1/shop/products?category=private-value&token=secret",
      statusCode: 503,
      durationMs: 12.8,
      requestId: "request-123",
      contentRevision: "rev-001",
    });

    expect(record).toEqual({
      event: "http.request",
      requestId: "request-123",
      method: "GET",
      path: "/v1/shop/products",
      status: 503,
      durationMs: 13,
      contentRevision: "rev-001",
    });
    expect(JSON.stringify(record)).not.toContain("private-value");
    expect(JSON.stringify(record)).not.toContain("secret");
  });
});
