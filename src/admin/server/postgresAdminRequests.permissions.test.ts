import { describe, expect, it } from "vitest";

import type { AdminRole } from "../domain/types";
import { createPostgresAdminClient } from "./postgresAdmin";

const unauthorizedRoles: AdminRole[] = ["editor", "viewer"];

describe.each(unauthorizedRoles)("request access for %s", (role) => {
  const client = createPostgresAdminClient({ id: "1", login: role, role, capabilities: [] });

  it("rejects request reads before touching the database", async () => {
    await expect(client.listRequests()).rejects.toMatchObject({ code: "forbidden" });
  });

  it("rejects request status changes before touching the database", async () => {
    await expect(client.updateRequestStatus("1", "closed")).rejects.toMatchObject({ code: "forbidden" });
  });
});