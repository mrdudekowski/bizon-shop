import { buildRequestNotificationText } from "./requestEmail";
import { loadRequestNotificationData, type RequestNotificationQuery } from "./requestNotificationData";
import { splitTelegramText } from "./requestTelegramFormat";

type Query = RequestNotificationQuery;
export type RequestTelegramConfig = { token: string; chatId: string; siteUrl?: string };
export type TelegramMessageInput = { chatId: string; text: string };
export type TelegramTransport = { sendMessage(message: TelegramMessageInput): Promise<{ messageId: number | string }> };
export type Delay = (milliseconds: number) => Promise<void>;

const MAX_ATTEMPTS = 6;
const LEASE_MS = 5 * 60_000;
const POLL_MS = 15_000;
const BATCH_SIZE = 10;
const MIN_CHAT_INTERVAL_MS = 1_000;

export class RequestTelegramDeliveryError extends Error {
  constructor(
    readonly code: string,
    readonly permanent: boolean,
    readonly retryAfterSeconds?: number,
  ) {
    super(code);
    this.name = "RequestTelegramDeliveryError";
  }
}

export function requestTelegramConfig(env: NodeJS.ProcessEnv = process.env): RequestTelegramConfig | null {
  const token = env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return null;
  const siteUrl = env.PUBLIC_SITE_URL?.trim();
  return { token, chatId, ...(siteUrl ? { siteUrl } : {}) };
}

function responseError(status: number, payload: Record<string, unknown>): RequestTelegramDeliveryError {
  const errorCode = Number(payload.error_code) || status;
  if (errorCode === 429 || status === 429) {
    const parameters = payload.parameters != null && typeof payload.parameters === "object"
      ? payload.parameters as Record<string, unknown>
      : {};
    const retryAfter = Number(parameters.retry_after);
    return new RequestTelegramDeliveryError(
      "telegram_rate_limited",
      false,
      Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(86_400, Math.ceil(retryAfter)) : 30,
    );
  }
  if (errorCode === 401 || status === 401) return new RequestTelegramDeliveryError("telegram_unauthorized", true);
  if (errorCode === 403 || status === 403) return new RequestTelegramDeliveryError("telegram_forbidden", true);
  if (errorCode === 400 || status === 400) return new RequestTelegramDeliveryError("telegram_bad_request", true);
  if (status >= 500 || errorCode >= 500) return new RequestTelegramDeliveryError("telegram_server_error", false);
  return new RequestTelegramDeliveryError("telegram_api_error", true);
}

export function createTelegramTransport(
  config: Pick<RequestTelegramConfig, "token">,
  fetcher: typeof fetch = fetch,
): TelegramTransport {
  return {
    async sendMessage(message) {
      let response: Response;
      try {
        response = await fetcher(`https://api.telegram.org/bot${config.token}/sendMessage`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ chat_id: message.chatId, text: message.text }),
          signal: AbortSignal.timeout(10_000),
        });
      } catch {
        throw new RequestTelegramDeliveryError("network_error", false);
      }

      let payload: Record<string, unknown>;
      try {
        const parsed: unknown = await response.json();
        if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid_response");
        payload = parsed as Record<string, unknown>;
      } catch {
        throw new RequestTelegramDeliveryError("telegram_malformed_response", false);
      }

      if (!response.ok || payload.ok !== true) throw responseError(response.status, payload);
      const result = payload.result != null && typeof payload.result === "object"
        ? payload.result as Record<string, unknown>
        : {};
      const messageId = result.message_id;
      if ((typeof messageId !== "number" && typeof messageId !== "string") || String(messageId).length === 0) {
        throw new RequestTelegramDeliveryError("telegram_malformed_response", false);
      }
      return { messageId };
    },
  };
}

function safeErrorCode(error: unknown): string {
  const code = error != null && typeof error === "object" && "code" in error ? String(error.code) : "telegram_delivery_error";
  return /^[A-Z0-9_-]{1,48}$/i.test(code) ? code : "telegram_delivery_error";
}

function retryDelayMs(attempt: number): number {
  return Math.min(6 * 60 * 60_000, 30_000 * 2 ** Math.max(0, attempt - 1));
}

function initialMessageIds(value: unknown): Array<number | string> {
  if (Array.isArray(value)) {
    return value.filter((id): id is number | string => typeof id === "number" || typeof id === "string");
  }
  if (typeof value === "string") {
    try {
      return initialMessageIds(JSON.parse(value));
    } catch {
      return [];
    }
  }
  return [];
}

const sleep: Delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function runRequestTelegramWorkerStep(
  query: Query,
  transport: TelegramTransport,
  config: RequestTelegramConfig,
  now = new Date(),
  delay: Delay = sleep,
): Promise<number> {
  const leaseUntil = new Date(now.getTime() + LEASE_MS);
  const claimed = await query(
    `WITH expired AS (
       UPDATE request_telegram_notifications SET status = 'retry_wait', locked_until = NULL, updated_at = $1
       WHERE status = 'processing' AND locked_until <= $1
     ), due AS (
       SELECT id FROM request_telegram_notifications
       WHERE status IN ('queued', 'retry_wait') AND next_attempt_at <= $1
       ORDER BY next_attempt_at, id LIMIT $2 FOR UPDATE SKIP LOCKED
     )
     UPDATE request_telegram_notifications n
       SET status = 'processing', attempt_count = n.attempt_count + 1, locked_until = $3, updated_at = $1
     FROM due WHERE n.id = due.id
     RETURNING n.id, n.request_id, n.attempt_count, n.next_part_index, n.telegram_message_ids`,
    [now, BATCH_SIZE, leaseUntil],
  );

  let lastSentAt: number | null = null;
  for (const job of claimed) {
    const requestId = Number(job.request_id);
    const attempt = Number(job.attempt_count);
    let nextPartIndex = Math.max(0, Number(job.next_part_index) || 0);
    const messageIds = initialMessageIds(job.telegram_message_ids);

    try {
      const notificationData = await loadRequestNotificationData(query, requestId);
      if (!notificationData) throw new RequestTelegramDeliveryError("request_missing", true);
      const text = buildRequestNotificationText(notificationData, { siteUrl: config.siteUrl });
      const parts = splitTelegramText(text);

      while (nextPartIndex < parts.length) {
        if (lastSentAt != null) {
          const remaining = MIN_CHAT_INTERVAL_MS - (Date.now() - lastSentAt);
          if (remaining > 0) await delay(remaining);
        }
        const result = await transport.sendMessage({ chatId: config.chatId, text: parts[nextPartIndex]! });
        lastSentAt = Date.now();
        messageIds.push(result.messageId);
        nextPartIndex += 1;
        await query(
          `UPDATE request_telegram_notifications
             SET next_part_index = $2, telegram_message_ids = $3::jsonb, locked_until = $4, updated_at = $4
           WHERE id = $1`,
          [job.id, nextPartIndex, JSON.stringify(messageIds), now],
        );
      }

      await query(
        `UPDATE request_telegram_notifications SET status = 'accepted_by_telegram', accepted_at = $2,
           locked_until = NULL, last_error_code = NULL, updated_at = $2 WHERE id = $1`,
        [job.id, now],
      );
      console.info(JSON.stringify({ event: "request_telegram.accepted_by_telegram", requestId, attempt, parts: parts.length }));
    } catch (error) {
      const permanent = error instanceof RequestTelegramDeliveryError && error.permanent;
      const final = permanent || attempt >= MAX_ATTEMPTS;
      const code = safeErrorCode(error);
      const retryAfterSeconds = error instanceof RequestTelegramDeliveryError ? error.retryAfterSeconds : undefined;
      const nextAttemptAt = new Date(now.getTime() + (retryAfterSeconds ? retryAfterSeconds * 1000 : retryDelayMs(attempt)));
      await query(
        `UPDATE request_telegram_notifications SET status = $2, next_attempt_at = $3, locked_until = NULL,
           last_error_code = $4, updated_at = $5 WHERE id = $1`,
        [job.id, final ? "failed_final" : "retry_wait", nextAttemptAt, code, now],
      );
      console.error(JSON.stringify({ event: "request_telegram.delivery_failed", requestId, attempt, final, errorCode: code }));
    }
  }
  return claimed.length;
}

export function startRequestTelegramWorker(query: Query, env: NodeJS.ProcessEnv = process.env): void {
  const config = requestTelegramConfig(env);
  if (!config) {
    console.info("request_telegram.worker_disabled", { reason: "telegram_configuration_incomplete" });
    return;
  }
  const transport = createTelegramTransport(config);
  let running = false;
  const poll = async () => {
    if (running) return;
    running = true;
    try {
      await runRequestTelegramWorkerStep(query, transport, config, new Date());
    } catch (error) {
      console.error("request_telegram.worker_failed", { errorCode: safeErrorCode(error) });
    } finally {
      running = false;
    }
  };
  const timer = setInterval(() => void poll(), POLL_MS);
  timer.unref();
  void poll();
}
