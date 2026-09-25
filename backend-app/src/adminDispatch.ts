import { AdminClientError } from "./admin/client/errors";
import type { AdminClient } from "./admin/client/adminClient";
import { createPostgresAdminClient } from "./admin/server/postgresAdmin";

type AdminCall = {
  method?: string;
  args?: unknown[];
};

export async function dispatchAdminCall(body: AdminCall): Promise<{
  status: number;
  body: { ok: boolean; result?: unknown; code?: string };
}> {
  const client = createPostgresAdminClient();
  const method = body.method;
  if (method == null || typeof client[method as keyof AdminClient] !== "function") {
    return { status: 400, body: { ok: false, code: "publish_blocked" } };
  }

  try {
    const result = await (
      client[method as keyof AdminClient] as (...args: unknown[]) => Promise<unknown>
    )(...(body.args ?? []));
    return { status: 200, body: { ok: true, result: result ?? null } };
  } catch (error) {
    const code = error instanceof AdminClientError ? error.code : "publish_blocked";
    return { status: 400, body: { ok: false, code } };
  }
}
