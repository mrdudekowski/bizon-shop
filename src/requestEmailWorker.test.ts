import { describe, expect, it, vi } from "vitest";
import { runRequestEmailWorkerStep } from "./requestEmailWorker";
import { PAGE_KEY_BY_SOURCE_FORM } from "./content/pageForm";
import { SOURCE_FORMS } from "./types/requestItem";

const config = { from: "Bizon <noreply@bizontop.ru>", to: "info@bizontop.ru" };

describe("request email outbox worker", () => {
  it("claims queued work and records SMTP acceptance", async () => {
    const query = vi.fn(async (sql: string) => {
      if (sql.includes("RETURNING n.id")) return [{ id: 3, request_id: 81, attempt_count: 1 }];
      if (sql.includes("SELECT * FROM requests WHERE")) return [{ id: 81, name: "Анна" }];
      if (sql.includes("SELECT * FROM requests_items")) return [];
      return [];
    });
    const sendMail = vi.fn(async () => ({ messageId: "mail-1" }));

    await expect(runRequestEmailWorkerStep(query, { sendMail }, { from: "Bizon <noreply@bizontop.ru>", to: "info@bizontop.ru" }, new Date("2026-01-01T00:00:00Z"))).resolves.toBe(1);

    expect(sendMail).toHaveBeenCalledOnce();
    expect(sendMail.mock.calls[0][0].text).toContain("Анна");
    expect(query.mock.calls.at(-1)?.[0]).toContain("accepted_by_smtp");
    expect(query.mock.calls[0][0]).toContain("LIMIT $2 FOR UPDATE SKIP LOCKED");
  });

  it("schedules transient errors with backoff without losing the row", async () => {
    const query = vi.fn(async (sql: string) => {
      if (sql.includes("RETURNING n.id")) return [{ id: 4, request_id: 82, attempt_count: 2 }];
      if (sql.includes("SELECT * FROM requests WHERE")) return [{ id: 82 }];
      if (sql.includes("SELECT * FROM requests_items")) return [];
      return [];
    });
    const sendMail = vi.fn(async () => { throw Object.assign(new Error("timeout"), { code: "ETIMEDOUT" }); });
    const now = new Date("2026-01-01T00:00:00Z");

    await runRequestEmailWorkerStep(query, { sendMail }, { from: "noreply@bizontop.ru", to: "info@bizontop.ru" }, now);

    const update = query.mock.calls.at(-1)!;
    expect(update[1]?.[1]).toBe("retry_wait");
    expect(update[1]?.[2]).toEqual(new Date(now.getTime() + 60_000));
  });

  it("includes current CMS field labels in configured-form email", async () => {
    const sent: Parameters<Parameters<typeof runRequestEmailWorkerStep>[1]["sendMail"]>[0][] = [];
    const query = vi.fn(async (sql: string) => {
      if (sql.includes("RETURNING n.id")) return [{ id: 5, request_id: 95, attempt_count: 1 }];
      if (sql.includes("SELECT * FROM requests WHERE")) return [{
        id: 95,
        source_form: "shop_warranty",
        source_page: "/shop/warranty/",
        name: "Тестовый клиент",
        phone: "+7 900 000-00-56",
        email: "test@example.com",
        form_answers: { name: "Тестовый клиент", phone: "+7 900 000-00-56", email: "test@example.com", problem: "Проблема теста" },
      }];
      if (sql.includes("SELECT * FROM requests_items")) return [];
      if (sql.includes("SELECT success_message, submit_label FROM page_forms")) {
        return [{ success_message: "Спасибо", submit_label: null }];
      }
      if (sql.includes("SELECT id, label, field_type, required FROM page_form_fields")) {
        return [
          { id: "name", label: "Ваше имя", field_type: "text", required: true },
          { id: "phone", label: "Телефон для связи", field_type: "tel", required: true },
          { id: "email", label: "Email", field_type: "email", required: false },
          { id: "problem", label: "Опишите ситуацию", field_type: "textarea", required: true },
        ];
      }
      return [];
    });
    const sendMail = vi.fn(async (message: Parameters<Parameters<typeof runRequestEmailWorkerStep>[1]["sendMail"]>[0]) => {
      sent.push(message);
      return { messageId: "mail-configured" };
    });

    await runRequestEmailWorkerStep(query, { sendMail }, config, new Date("2026-01-01T00:00:00Z"));

    expect(sent[0]?.text).toContain("Опишите ситуацию: Проблема теста");
    expect(sent[0]?.text).not.toContain('"problem"');
    expect(query).toHaveBeenCalledWith(expect.stringContaining("FROM page_form_fields"), ["shop-warranty"]);
  });

  it.each(Object.entries(PAGE_KEY_BY_SOURCE_FORM))("uses the CMS label contract for %s", async (sourceForm, pageKey) => {
    const query = vi.fn(async (sql: string) => {
      if (sql.includes("RETURNING n.id")) return [{ id: 6, request_id: 96, attempt_count: 1 }];
      if (sql.includes("SELECT * FROM requests WHERE")) return [{
        id: 96,
        source_form: sourceForm,
        source_page: "/configured-form/",
        form_answers: { custom_question: "Проверенный ответ" },
      }];
      if (sql.includes("SELECT * FROM requests_items")) return [];
      if (sql.includes("SELECT success_message, submit_label FROM page_forms")) {
        return [{ success_message: "Спасибо", submit_label: null }];
      }
      if (sql.includes("SELECT id, label, field_type, required FROM page_form_fields")) {
        return [{ id: "custom_question", label: "Вопрос из CMS", field_type: "text", required: true }];
      }
      return [];
    });
    const sendMail = vi.fn(async () => ({ messageId: `mail-${sourceForm}` }));

    await runRequestEmailWorkerStep(query, { sendMail }, config, new Date("2026-01-01T00:00:00Z"));

    expect(sendMail.mock.calls[0]?.[0].text).toContain("Вопрос из CMS: Проверенный ответ");
    expect(query).toHaveBeenCalledWith(expect.stringContaining("FROM page_form_fields"), [pageKey]);
  });

  it.each(SOURCE_FORMS)("sends the %s request through the common email transport", async ({ value }) => {
    const query = vi.fn(async (sql: string) => {
      if (sql.includes("RETURNING n.id")) return [{ id: 8, request_id: 108, attempt_count: 1 }];
      if (sql.includes("SELECT * FROM requests WHERE")) return [{ id: 108, source_form: value, source_page: "/test/", name: "Проверка типа заявки" }];
      return [];
    });
    const sendMail = vi.fn(async () => ({ messageId: `mail-${value}` }));

    await expect(runRequestEmailWorkerStep(query, { sendMail }, config, new Date("2026-01-01T00:00:00Z"))).resolves.toBe(1);

    expect(sendMail).toHaveBeenCalledOnce();
    expect(sendMail.mock.calls[0]?.[0].text).toContain("Проверка типа заявки");
    expect(query.mock.calls.at(-1)?.[0]).toContain("accepted_by_smtp");
  });

  it("does not look up CMS labels for the contextual branding form", async () => {
    const query = vi.fn(async (sql: string) => {
      if (sql.includes("RETURNING n.id")) return [{ id: 9, request_id: 109, attempt_count: 1 }];
      if (sql.includes("SELECT * FROM requests WHERE")) return [{ id: 109, source_form: "branding", source_page: "/contact/", name: "Контекстная заявка", message: "Брендирование парка" }];
      return [];
    });
    const sendMail = vi.fn(async () => ({ messageId: "mail-context-branding" }));

    await runRequestEmailWorkerStep(query, { sendMail }, config, new Date("2026-01-01T00:00:00Z"));

    expect(sendMail.mock.calls[0]?.[0].text).toContain("Сообщение: Брендирование парка");
    expect(query.mock.calls.some(([sql]) => sql.includes("page_form_fields"))).toBe(false);
    expect(PAGE_KEY_BY_SOURCE_FORM.branding).toBe("branding");
  });
});
