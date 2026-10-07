import { describe, expect, it } from "vitest";

import { isAdminRequestOriginAllowed, localOriginHeaders } from "./adminCors";

describe("local admin CORS headers", () => {
  it("allows the media replacement and cancellation methods from the local CMS", () => {
    const headers = localOriginHeaders("http://127.0.0.1:3001");

    expect(headers["access-control-allow-origin"]).toBe("http://127.0.0.1:3001");
    expect(headers["access-control-allow-methods"]?.split(", ")).toEqual([
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS",
    ]);
    expect(headers["access-control-allow-credentials"]).toBe("true");
  });

  it("does not return CORS permission headers for a non-local origin", () => {
    expect(localOriginHeaders("https://attacker.example")).toEqual({});
  });

  it("does not allow a different local port to use the CMS session", () => {
    expect(localOriginHeaders("http://127.0.0.1:3000")).toEqual({});
    expect(localOriginHeaders("http://localhost:3002")).toEqual({});
    expect(localOriginHeaders("http://localhost")).toEqual({});
  });

  it("rejects state-changing admin requests from unapproved origins", () => {
    expect(isAdminRequestOriginAllowed("/v1/admin", "POST", "https://attacker.example")).toBe(false);
    expect(isAdminRequestOriginAllowed("/v1/admin/assets/1", "PUT", "http://127.0.0.1:3001")).toBe(true);
    expect(isAdminRequestOriginAllowed("/v1/admin/assets/1/replacement", "DELETE", "http://localhost:3001")).toBe(true);
  });

  it("keeps reads and origin-less service calls outside the browser-origin check", () => {
    expect(isAdminRequestOriginAllowed("/v1/admin/auth/session", "GET", "https://attacker.example")).toBe(true);
    expect(isAdminRequestOriginAllowed("/v1/admin", "POST", undefined)).toBe(true);
  });
});
