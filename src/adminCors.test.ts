import { afterEach, describe, expect, it, vi } from "vitest";

import { isRequestOriginAllowed, localOriginHeaders } from "./adminCors";

const cmsOrigin = "http://127.0.0.1:3001";
const siteOrigin = "http://127.0.0.1:3000";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("route-scoped CORS", () => {
  it("allows the CMS origin to use admin routes", () => {
    expect(isRequestOriginAllowed("/v1/admin", "POST", cmsOrigin)).toBe(true);
    expect(isRequestOriginAllowed("/v1/admin/assets/1", "PUT", cmsOrigin)).toBe(true);
    expect(localOriginHeaders("/v1/admin", cmsOrigin)["access-control-allow-origin"]).toBe(cmsOrigin);
  });

  it("does not grant the public site origin access to CMS admin routes", () => {
    expect(isRequestOriginAllowed("/v1/admin/auth/session", "GET", siteOrigin)).toBe(false);
    expect(isRequestOriginAllowed("/v1/admin", "POST", siteOrigin)).toBe(false);
    expect(localOriginHeaders("/v1/admin", siteOrigin)).toEqual({});
  });

  it("allows the public site origin only on public API routes", () => {
    expect(isRequestOriginAllowed("/v1/requests", "POST", siteOrigin)).toBe(true);
    expect(isRequestOriginAllowed("/v1/cart", "PUT", siteOrigin)).toBe(true);
    expect(isRequestOriginAllowed("/v1/articles", "GET", siteOrigin)).toBe(true);
    expect(localOriginHeaders("/v1/requests", siteOrigin)["access-control-allow-origin"]).toBe(siteOrigin);
  });

  it("rejects an unapproved browser origin for both admin and public routes", () => {
    expect(isRequestOriginAllowed("/v1/admin", "POST", "https://attacker.example")).toBe(false);
    expect(isRequestOriginAllowed("/v1/requests", "POST", "https://attacker.example")).toBe(false);
    expect(localOriginHeaders("/v1/admin", "https://attacker.example")).toEqual({});
  });

  it("uses separate configured origin lists in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CORS_ALLOWED_ORIGINS", "https://www.bizontires.example");
    vi.stubEnv("CMS_ALLOWED_ORIGINS", "https://cms.bizontires.example");

    expect(isRequestOriginAllowed("/v1/requests", "POST", "https://www.bizontires.example")).toBe(true);
    expect(isRequestOriginAllowed("/v1/admin", "POST", "https://www.bizontires.example")).toBe(false);
    expect(isRequestOriginAllowed("/v1/admin", "POST", "https://cms.bizontires.example")).toBe(true);
    expect(isRequestOriginAllowed("/v1/requests", "POST", "https://cms.bizontires.example")).toBe(false);
  });

  it("allows origin-less service calls while keeping browser origins scoped", () => {
    expect(isRequestOriginAllowed("/v1/admin", "POST", undefined)).toBe(true);
    expect(isRequestOriginAllowed("/v1/requests", "POST", undefined)).toBe(true);
  });
});
