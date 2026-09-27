export const runtime = "nodejs";

/** Writes go to backend-app. This route stays so an old same-origin call is not a silent local database write. */
export async function POST() {
  return Response.json(
    { ok: false, code: "publish_blocked" },
    { status: 410 },
  );
}
