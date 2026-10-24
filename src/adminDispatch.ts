import { AdminClientError, adminCodeFromDatabaseError, adminErrorStatus } from "./admin/client/errors";
import type { AdminClient } from "./admin/client/adminClient";
import type { AuthenticatedAccount } from "./admin/server/adminAuth";
import { createPostgresAdminClient } from "./admin/server/postgresAdmin";

type AdminCall = {
  method?: string;
  args?: unknown[];
};

export async function dispatchAdminCall(
  body: AdminCall,
  account: AuthenticatedAccount,
): Promise<{
  status: number;
  body: { ok: boolean; result?: unknown; code?: string };
}> {
  const client = createPostgresAdminClient(account);
  const method = body.method;
  if (method == null || method === "createAsset" || typeof client[method as keyof AdminClient] !== "function") {
    return { status: 400, body: { ok: false, code: "publish_blocked" } };
  }

  try {
    const result = await (
      client[method as keyof AdminClient] as (...args: unknown[]) => Promise<unknown>
    )(...(body.args ?? []));
    return { status: 200, body: { ok: true, result: result ?? null } };
  } catch (error) {
    if (!(error instanceof AdminClientError)) {
      const databaseCode = adminCodeFromDatabaseError(error);
      const code = databaseCode ?? "internal_error";
      console.error(JSON.stringify({
        event: "admin.action_failed",
        method,
        errorClass: error instanceof Error ? error.name : "unknown",
        ...(databaseCode ? { databaseCode: (error as { code: string }).code } : {}),
      }));
      return { status: adminErrorStatus(code), body: { ok: false, code } };
    }
    const code = error.code;
    return { status: adminErrorStatus(code), body: { ok: false, code } };
  }
}
