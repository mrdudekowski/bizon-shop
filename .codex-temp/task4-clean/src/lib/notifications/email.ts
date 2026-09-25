import type { NormalizedRequest } from "@/lib/requests/types";

export type EmailSendResult =
  | { ok: true; skipped?: false }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; skipped?: false; error: string };

export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_PORT?.trim() &&
      process.env.SMTP_FROM?.trim() &&
      process.env.REQUESTS_EMAIL_TO?.trim(),
  );
}

/**
 * Optional email channel. SMTP client is not bundled yet — logs intent when configured.
 * TODO: add nodemailer transport when SMTP credentials are available in production.
 */
export async function sendRequestEmailNotification(
  data: NormalizedRequest,
  requestId: string | number,
): Promise<EmailSendResult> {
  if (!isSmtpConfigured()) {
    return { ok: false, skipped: true, reason: "SMTP not configured" };
  }

  console.info("[notifications/email] SMTP configured but transport not implemented yet", {
    requestId,
    to: process.env.REQUESTS_EMAIL_TO,
    from: data.email ?? data.phone,
  });

  return {
    ok: false,
    skipped: true,
    reason: "SMTP transport pending — see docs/requests-flow-report.md",
  };
}
