import { beforeEach, describe, expect, it, vi } from "vitest";

const createPostgresAdminClient = vi.hoisted(() => vi.fn());
vi.mock("./admin/server/postgresAdmin", () => ({ createPostgresAdminClient }));

import { AdminClientError } from "./admin/client/errors";
import type { AdminClient } from "./admin/client/adminClient";
import { dispatchAdminCall } from "./adminDispatch";

const account = { id: 1, login: "admin", role: "admin" as const, capabilities: [] };

describe("media usage admin RPC", () => {
  beforeEach(() => createPostgresAdminClient.mockReset());

  it("forwards the exact media and association identity to the authenticated admin client", async () => {
    const detachAssetUsage = vi.fn().mockResolvedValue(undefined);
    createPostgresAdminClient.mockReturnValue({ detachAssetUsage } as unknown as AdminClient);

    await expect(dispatchAdminCall({ method: "detachAssetUsage", args: ["42", "shop_category_carousel|image_id|9"] }, account))
      .resolves.toEqual({ status: 200, body: { ok: true, result: null } });
    expect(detachAssetUsage).toHaveBeenCalledWith("42", "shop_category_carousel|image_id|9");
  });

  it("preserves conflict and forbidden responses for stale links and unauthorized callers", async () => {
    const detachAssetUsage = vi.fn().mockRejectedValue(new AdminClientError("conflict"));
    createPostgresAdminClient.mockReturnValue({ detachAssetUsage } as unknown as AdminClient);
    await expect(dispatchAdminCall({ method: "detachAssetUsage", args: ["42", "stale"] }, account))
      .resolves.toMatchObject({ status: 409, body: { ok: false, code: "conflict" } });

    detachAssetUsage.mockRejectedValue(new AdminClientError("forbidden"));
    await expect(dispatchAdminCall({ method: "detachAssetUsage", args: ["42", "valid"] }, account))
      .resolves.toMatchObject({ status: 403, body: { ok: false, code: "forbidden" } });
  });
});
