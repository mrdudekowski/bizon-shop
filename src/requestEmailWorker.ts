import nodemailer, { type Transporter } from "nodemailer";
import { buildRequestEmail, type RequestEmailData, type RequestEmailMessage } from "./requestEmail";

type Query = (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;
type Transport = { sendMail(message: RequestEmailMessage & { messageId?: string }): Promise<{ messageId?: string }> };

const MAX_ATTEMPTS = 6;
const LEASE_MS = 5 * 60_000;
const POLL_MS = 15_000;
const BATCH_SIZE = 10;

export type RequestEmailConfig = {
  host: string; port: number; secure: boolean; user: string; password: string; from: string; to: string;
};

export function requestEmailConfig(env: NodeJS.ProcessEnv = process.env): RequestEmailConfig | null {
  const { SMTP_HOST: host, SMTP_USER: user, SMTP_PASSWORD: password, MAIL_FROM: from } = env;
  const port = Number(env.SMTP_PORT);
  const to = env.REQUEST_NOTIFICATION_EMAIL_TO;
  if (!host || !user || !password || !from || !to || !Number.isInteger(port) || port < 1 || port > 65535) return null;
  return { host, port, secure: env.SMTP_SECURE === "true", user, password, from, to };
}

export function createSmtpTransport(config: RequestEmailConfig): Transporter {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
}

function isPermanent(error: unknown): boolean {
  const code = error != null && typeof error === "object" && "code" in error ? String(error.code) : "";
  return ["EAUTH", "EENVELOPE", "EINVALIDRECIPIENT", "EMESSAGE"].includes(code);
}

function safeErrorCode(error: unknown): string {
  const code = error != null && typeof error === "object" && "code" in error ? String(error.code) : "delivery_error";
  return /^[A-Z0-9_-]{1,48}$/i.test(code) ? code : "delivery_error";
}

function retryDelayMs(attempt: number): number {
  return Math.min(6 * 60 * 60_000, 30_000 * 2 ** Math.max(0, attempt - 1));
}

export async function runRequestEmailWorkerStep(query: Query, transport: Transport, config: Pick<RequestEmailConfig, "from" | "to">, now = new Date()): Promise<number> {
  const leaseUntil = new Date(now.getTime() + LEASE_MS);
  const claimed = await query(
    `WITH expired AS (
       UPDATE request_email_notifications SET status = 'retry_wait', locked_until = NULL, updated_at = $1
       WHERE status = 'processing' AND locked_until <= $1
     ), due AS (
       SELECT id FROM request_email_notifications
       WHERE status IN ('queued', 'retry_wait') AND next_attempt_at <= $1
       ORDER BY next_attempt_at, id LIMIT $2 FOR UPDATE SKIP LOCKED
     )
     UPDATE request_email_notifications n
       SET status = 'processing', attempt_count = n.attempt_count + 1, locked_until = $3, updated_at = $1
     FROM due WHERE n.id = due.id
     RETURNING n.id, n.request_id, n.attempt_count`,
    [now, BATCH_SIZE, leaseUntil],
  );

  for (const job of claimed) {
    const requestId = Number(job.request_id);
    const attempt = Number(job.attempt_count);
    try {
      const [request] = await query("SELECT * FROM requests WHERE id = $1", [requestId]);
      if (!request) throw Object.assign(new Error("request_missing"), { code: "EENVELOPE" });
      const items = await query("SELECT * FROM requests_items WHERE _parent_id = $1 ORDER BY _order, id", [requestId]);
      const message = buildRequestEmail({ ...request, items } as RequestEmailData, {
        to: config.to,
        from: config.from,
      });
      const domain = config.from.match(/@([^>\s]+)/)?.[1] ?? "bizon.invalid";
      const result = await transport.sendMail({ ...message, messageId: `<request-${requestId}@${domain}>` });
      await query(
        `UPDATE request_email_notifications SET status = 'accepted_by_smtp', accepted_at = $2,
           provider_message_id = $3, locked_until = NULL, last_error_code = NULL, updated_at = $2 WHERE id = $1`,
        [job.id, now, result.messageId ?? null],
      );
      console.info(JSON.stringify({ event: "request_email.accepted_by_smtp", requestId, attempt }));
    } catch (error) {
      const final = isPermanent(error) || attempt >= MAX_ATTEMPTS;
      const code = safeErrorCode(error);
      await query(
        `UPDATE request_email_notifications SET status = $2, next_attempt_at = $3, locked_until = NULL,
           last_error_code = $4, updated_at = $5 WHERE id = $1`,
        [job.id, final ? "failed_final" : "retry_wait", new Date(now.getTime() + retryDelayMs(attempt)), code, now],
      );
      console.error(JSON.stringify({ event: "request_email.delivery_failed", requestId, attempt, final, errorCode: code }));
    }
  }
  return claimed.length;
}

export function startRequestEmailWorker(query: Query): void {
  const config = requestEmailConfig();
  if (!config) {
    console.info("request_email.worker_disabled", { reason: "smtp_configuration_incomplete" });
    return;
  }
  const transport = createSmtpTransport(config);
  let running = false;
  const poll = async () => {
    if (running) return;
    running = true;
    try {
      await runRequestEmailWorkerStep(query, transport, config, new Date());
    } catch (error) {
      console.error("request_email.worker_failed", { errorCode: safeErrorCode(error) });
    } finally {
      running = false;
    }
  };
  const timer = setInterval(() => void poll(), POLL_MS);
  timer.unref();
  void poll();
}
