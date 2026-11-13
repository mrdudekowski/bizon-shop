import { afterEach, describe, expect, it, vi } from "vitest";

const { publishPage } = vi.hoisted(() => ({ publishPage: vi.fn() }));

vi.mock("./admin/server/postgresAdmin", () => ({
  createPostgresAdminClient: () => ({ publishPage }),
}));

import { dispatchAdminCall } from "./adminDispatch";
import type { AuthenticatedAccount } from "./admin/server/adminAuth";

const account: AuthenticatedAccount = {
  id: "1",
  login: "admin",
  role: "admin",
  capabilities: ["edit_site_pages"],
};

afterEach(() => {
  vi.restoreAllMocks();
  publishPage.mockReset();
});

describe("dispatchAdminCall", () => {
  it("logs PostgreSQL diagnostics and returns only a safe code for publish failures", async () => {
    publishPage.mockRejectedValue(Object.assign(new Error("insert failed"), {
      code: "23502",
      schema: "public",
      table: "cms_image_focal_positions",
      column: "focal_by_viewport",
      constraint: "cms_image_focal_positions_focal_by_viewport_check",
    }));
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await dispatchAdminCall(
      { method: "publishPage", args: ["shop-home"] },
      account,
      "request-123",
    );

    expect(result).toEqual({ status: 500, body: { ok: false, code: "database_write_failed" } });
    expect(publishPage).toHaveBeenCalledWith("shop-home");
    const record = JSON.parse(String(log.mock.calls[0][0]));
    expect(record).toMatchObject({
      event: "admin.action_failed",
      method: "publishPage",
      requestId: "request-123",
      databaseError: {
        code: "23502",
        schema: "public",
        table: "cms_image_focal_positions",
        column: "focal_by_viewport",
        constraint: "cms_image_focal_positions_focal_by_viewport_check",
      },
    });
    expect(JSON.stringify(result.body)).not.toContain("focal_by_viewport");
  });
});
