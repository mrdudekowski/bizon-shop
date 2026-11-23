import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createTelegramTransport,
  requestTelegramConfig,
  RequestTelegramDeliveryError,
  runRequestTelegramWorkerStep,
} from "./requestTelegramWorker";
import { buildRequestNotificationText } from "./requestEmail";
import { splitTelegramText } from "./requestTelegramFormat";
import { SOURCE_FORMS } from "./types/requestItem";

const config = { token: "unit-test-token", chatId: "-100123456", siteUrl: "https://www.bizontop.ru" };
const now = new Date("2026-01-01T00:00:00.000Z");

afterEach(() => vi.restoreAllMocks());

function workerQuery(request: Record<string, unknown> = { id: 81, name: "Анна", message: "Нужна консультация" }) {
  const calls: Array<{ sql: string; params?: unknown[] }> = [];
  const query = vi.fn(async (sql: string, params?: unknown[]) => {
    calls.push({ sql, params });
    if (sql.includes("RETURNING n.id")) {
      return [{ id: 3, request_id: 81, attempt_count: 1, next_part_index: 0, telegram_message_ids: [] }];
    }
    if (sql.includes("SELECT * FROM requests WHERE")) return [request];
    if (sql.includes("SELECT * FROM requests_items")) return [];
    return [];
  });
  return { query, calls };
}

describe("requestTelegramConfig", () => {
  it("requires both backend secrets and reads only the configured public-site URL optionally", () => {
    expect(requestTelegramConfig({ TELEGRAM_BOT_TOKEN: "token-only" } as NodeJS.ProcessEnv)).toBeNull();
    expect(requestTelegramConfig({ TELEGRAM_CHAT_ID: "chat-only" } as NodeJS.ProcessEnv)).toBeNull();
    expect(requestTelegramConfig({ TELEGRAM_BOT_TOKEN: " bot-token ", TELEGRAM_CHAT_ID: " -10042 ", PUBLIC_SITE_URL: " https://www.bizontop.ru " } as NodeJS.ProcessEnv))
      .toEqual({ token: "bot-token", chatId: "-10042", siteUrl: "https://www.bizontop.ru" });
  });
});

describe("Telegram Bot API transport", () => {
  it("sends plain text to the configured chat and returns only the accepted message ID", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ ok: true, result: { message_id: 77 } }), { status: 200 }));
    const transport = createTelegramTransport(config, fetcher as typeof fetch);

    await expect(transport.sendMessage({ chatId: config.chatId, text: "Заявка" })).resolves.toEqual({ messageId: 77 });
    expect(fetcher).toHaveBeenCalledOnce();
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/botunit-test-token/sendMessage");
    expect(JSON.parse(String(init.body))).toEqual({ chat_id: config.chatId, text: "Заявка" });
    expect(init.body).not.toContain("parse_mode");
  });

  it("classifies 429 and uses retry_after without exposing the response body or URL", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ ok: false, error_code: 429, description: "private detail", parameters: { retry_after: 37 } }), { status: 429 }));
    const transport = createTelegramTransport(config, fetcher as typeof fetch);

    const error = await transport.sendMessage({ chatId: config.chatId, text: "Заявка" }).catch((value: unknown) => value);
    expect(error).toBeInstanceOf(RequestTelegramDeliveryError);
    expect(error).toMatchObject({ code: "telegram_rate_limited", retryAfterSeconds: 37, permanent: false });
    expect(JSON.stringify(error)).not.toContain(config.token);
    expect(JSON.stringify(error)).not.toContain("private detail");
  });

  it("treats permission failures as final without retaining provider text", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ ok: false, error_code: 403, description: "private chat detail" }), { status: 403 }));
    const error = await createTelegramTransport(config, fetcher as typeof fetch)
      .sendMessage({ chatId: config.chatId, text: "Заявка" }).catch((value: unknown) => value);

    expect(error).toMatchObject({ code: "telegram_forbidden", permanent: true });
    expect(JSON.stringify(error)).not.toContain("private chat detail");
    expect(JSON.stringify(error)).not.toContain(config.chatId);
  });

  it.each([
    [401, "telegram_unauthorized", true],
    [400, "telegram_bad_request", true],
    [500, "telegram_server_error", false],
  ])("classifies provider HTTP %s without storing response details", async (status, code, permanent) => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ ok: false, error_code: status, description: "sensitive provider detail" }), { status }));
    const error = await createTelegramTransport(config, fetcher as typeof fetch)
      .sendMessage({ chatId: config.chatId, text: "Заявка" }).catch((value: unknown) => value);

    expect(error).toMatchObject({ code, permanent });
    expect(JSON.stringify(error)).not.toContain("sensitive provider detail");
  });

  it("maps network failures and malformed responses to safe transient errors", async () => {
    const networkError = await createTelegramTransport(config, vi.fn(async () => { throw new Error(config.token); }) as typeof fetch)
      .sendMessage({ chatId: config.chatId, text: "Заявка" }).catch((value: unknown) => value);
    const malformed = await createTelegramTransport(config, vi.fn(async () => new Response("not-json", { status: 200 })) as typeof fetch)
      .sendMessage({ chatId: config.chatId, text: "Заявка" }).catch((value: unknown) => value);

    expect(networkError).toMatchObject({ code: "network_error", permanent: false });
    expect(JSON.stringify(networkError)).not.toContain(config.token);
    expect(malformed).toMatchObject({ code: "telegram_malformed_response", permanent: false });
  });
});

describe("request Telegram outbox worker", () => {
  it("claims the request, sends the shared notification body, and records Telegram acceptance", async () => {
    const { query, calls } = workerQuery();
    const sendMessage = vi.fn(async () => ({ messageId: 101 }));

    await expect(runRequestTelegramWorkerStep(query, { sendMessage }, config, now, async () => {})).resolves.toBe(1);

    expect(query.mock.calls[0]?.[0]).toContain("LIMIT $2 FOR UPDATE SKIP LOCKED");
    expect(sendMessage).toHaveBeenCalledWith({ chatId: config.chatId, text: expect.stringContaining("Новая заявка Bizon #81") });
    const progress = calls.find(({ sql }) => sql.includes("next_part_index ="));
    expect(progress?.params?.[2]).toBe(JSON.stringify([101]));
    expect(calls.at(-1)?.sql).toContain("accepted_by_telegram");
  });

  it("stores part progress and resumes after the accepted part if a later send fails", async () => {
    const longRequest = { id: 81, name: "Анна", message: "🚚".repeat(4000) };
    const { query, calls } = workerQuery(longRequest);
    const delay = vi.fn(async () => {});
    const sendMessage = vi.fn()
      .mockResolvedValueOnce({ messageId: 201 })
      .mockRejectedValueOnce(new RequestTelegramDeliveryError("telegram_rate_limited", false, 45));

    await runRequestTelegramWorkerStep(query, { sendMessage }, config, now, delay);

    expect(sendMessage).toHaveBeenCalledTimes(2);
    expect(delay).toHaveBeenCalledOnce();
    expect(delay.mock.calls[0]?.[0]).toBeGreaterThan(0);
    const progress = calls.find(({ sql, params }) => sql.includes("next_part_index =") && params?.[1] === 1);
    expect(progress?.params?.[2]).toBe(JSON.stringify([201]));
    expect(calls.at(-1)?.params?.[1]).toBe("retry_wait");
    expect(calls.at(-1)?.params?.[2]).toEqual(new Date(now.getTime() + 45_000));
  });

  it("resumes from the persisted part index without resending an accepted message", async () => {
    const longRequest = { id: 81, name: "Анна", message: "🚚".repeat(4000) };
    const { query, calls } = workerQuery(longRequest);
    query.mockImplementation(async (sql: string, params?: unknown[]) => {
      calls.push({ sql, params });
      if (sql.includes("RETURNING n.id")) return [{ id: 3, request_id: 81, attempt_count: 2, next_part_index: 1, telegram_message_ids: [201] }];
      if (sql.includes("SELECT * FROM requests WHERE")) return [longRequest];
      if (sql.includes("SELECT * FROM requests_items")) return [];
      return [];
    });
    let messageNumber = 201;
    const sendMessage = vi.fn(async () => ({ messageId: ++messageNumber }));

    await runRequestTelegramWorkerStep(query, { sendMessage }, config, now, async () => {});

    const expectedPartCount = splitTelegramText(buildRequestNotificationText(longRequest)).length;
    expect(sendMessage).toHaveBeenCalledTimes(expectedPartCount - 1);
    const finalProgress = calls.filter(({ sql }) => sql.includes("next_part_index =")).at(-1);
    expect(finalProgress?.params?.[1]).toBe(expectedPartCount);
    expect(JSON.parse(String(finalProgress?.params?.[2]))).toHaveLength(expectedPartCount);
    expect(finalProgress?.params?.[2]).toContain("201");
    expect(calls.at(-1)?.sql).toContain("accepted_by_telegram");
  });

  it("keeps transient errors retryable and marks permanent errors as final", async () => {
    const transient = workerQuery();
    await runRequestTelegramWorkerStep(transient.query, { sendMessage: async () => { throw new RequestTelegramDeliveryError("network_timeout", false); } }, config, now, async () => {});
    expect(transient.calls.at(-1)?.params?.[1]).toBe("retry_wait");

    const permanent = workerQuery();
    await runRequestTelegramWorkerStep(permanent.query, { sendMessage: async () => { throw new RequestTelegramDeliveryError("telegram_forbidden", true); } }, config, now, async () => {});
    expect(permanent.calls.at(-1)?.params?.[1]).toBe("failed_final");

    const exhausted = workerQuery();
    exhausted.query.mockImplementation(async (sql: string, params?: unknown[]) => {
      exhausted.calls.push({ sql, params });
      if (sql.includes("RETURNING n.id")) return [{ id: 3, request_id: 81, attempt_count: 6, next_part_index: 0, telegram_message_ids: [] }];
      if (sql.includes("SELECT * FROM requests WHERE")) return [{ id: 81, name: "Анна" }];
      return [];
    });
    await runRequestTelegramWorkerStep(exhausted.query, { sendMessage: async () => { throw new RequestTelegramDeliveryError("network_timeout", false); } }, config, now, async () => {});
    expect(exhausted.calls.at(-1)?.params?.[1]).toBe("failed_final");
  });

  it("recovers expired leases in the claim query and leaves queued work alone when configuration is missing", async () => {
    const expired = workerQuery();
    await runRequestTelegramWorkerStep(expired.query, { sendMessage: async () => ({ messageId: 301 }) }, config, now, async () => {});
    expect(expired.calls[0]?.sql).toContain("locked_until <= $1");
    expect(expired.calls[0]?.sql).toContain("status = 'retry_wait'");

    const query = vi.fn();
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const { startRequestTelegramWorker } = await import("./requestTelegramWorker");
    startRequestTelegramWorker(query, {} as NodeJS.ProcessEnv);
    expect(query).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith("request_telegram.worker_disabled", { reason: "telegram_configuration_incomplete" });
  });

  it("uses current CMS field labels for configured forms", async () => {
    const { query, calls } = workerQuery({
      id: 81,
      source_form: "shop_warranty",
      form_answers: { problem: "Не доставили" },
    });
    query.mockImplementation(async (sql: string, params?: unknown[]) => {
      calls.push({ sql, params });
      if (sql.includes("RETURNING n.id")) return [{ id: 3, request_id: 81, attempt_count: 1, next_part_index: 0, telegram_message_ids: [] }];
      if (sql.includes("SELECT * FROM requests WHERE")) return [{ id: 81, source_form: "shop_warranty", form_answers: { problem: "Не доставили" } }];
      if (sql.includes("SELECT id, label, field_type, required FROM page_form_fields")) return [{ id: "problem", label: "Опишите проблему", field_type: "textarea", required: true }];
      if (sql.includes("SELECT success_message, submit_label FROM page_forms")) return [{ success_message: "Спасибо", submit_label: null }];
      return [];
    });
    let sentText = "";

    await runRequestTelegramWorkerStep(query, { sendMessage: async ({ text }) => { sentText = text; return { messageId: 111 }; } }, config, now, async () => {});

    expect(sentText).toContain("Опишите проблему: Не доставили");
    expect(calls.some(({ sql }) => sql.includes("FROM page_form_fields"))).toBe(true);
  });

  it.each(SOURCE_FORMS)("uses the same notification text as email for request source %s", async ({ value }) => {
    const request = { id: 81, source_form: value, source_page: "/test/", name: "Заявка для проверки" };
    const { query } = workerQuery(request);
    let sentText = "";

    await runRequestTelegramWorkerStep(query, { sendMessage: async ({ text }) => { sentText = text; return { messageId: 401 }; } }, config, now, async () => {});

    expect(sentText).toBe(buildRequestNotificationText(request));
  });
});
