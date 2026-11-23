import { describe, expect, it } from "vitest";
import { buildRequestEmail, buildRequestNotificationText } from "./requestEmail";
import { SOURCE_FORMS } from "./types/requestItem";

const config = { to: "info@bizontop.ru", from: "Bizon <noreply@bizontop.ru>" };

function occurrences(value: string, search: string): number {
  return value.split(search).length - 1;
}

describe("buildRequestEmail", () => {
  it("uses the shared notification body without changing the email text contract", () => {
    const data = {
      id: 421,
      created_at: "2026-11-23T08:00:00.000Z",
      source_form: "procurement",
      source_page: "/contact/",
      name: "Анна Тест",
      phone: "+7 900 000-00-00",
      email: "anna@example.com",
      city: "Владивосток",
      company_name: "Bizon Demo",
      inn: "2500000000",
      position: "Закупщик",
      purchase_volume: "12 шин",
      preferred_contact: "phone",
      message: "Типоразмер: 12.00R20\nКоличество: 6\nОсь: ведущая\nПроверочный комментарий",
      form_answers: { contact_name: "Анна Тест", region: "Приморский край", deliveryWindow: "7 дней" },
      form_answer_labels: { region: "Регион клиента", deliveryWindow: "Срок поставки" },
      selection_context: { tireSize: "12.00R20", axle: "Ведущая" },
      attachment_url: "https://files.example.com/spec.pdf",
      utm_source: "newsletter",
      utm_medium: "email",
      utm_campaign: "winter-2026",
      items: [{ item_type: "tire", item_name: "DSR158", variant_label: "12.00R20", quantity: 6, url: "/models/tbr/dsr158" }],
    };
    const siteUrl = "https://www.bizontop.ru/";

    expect(buildRequestNotificationText(data, { siteUrl })).toBe(
      buildRequestEmail(data, { ...config, siteUrl }).text,
    );
  });

  it("includes submitted answers and items as text and escaped HTML", () => {
    const email = buildRequestEmail({
      id: 42,
      name: "<script>alert(1)</script>",
      email: "buyer@example.com",
      form_answers: { project: "Карьер <Север>" },
      items: [{ item_name: "Шина", variant_label: "315/80", quantity: 4 }],
    }, { to: "info@bizontop.ru", from: "Bizon <noreply@bizontop.ru>" });

    expect(email.to).toBe("info@bizontop.ru");
    expect(email.replyTo).toBe("buyer@example.com");
    expect(email.text).toContain("Карьер <Север>");
    expect(email.text).toContain("1. Шина");
    expect(email.text).toContain("Размер / вариант: 315/80");
    expect(email.text).toContain("Количество: 4");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).not.toContain("<script>");
  });

  it("does not turn unsafe attachment schemes into clickable links", () => {
    const email = buildRequestEmail({ id: 7, attachment_url: "javascript:alert(1)" }, { to: "info@bizontop.ru", from: "noreply@bizontop.ru" });
    expect(email.html).not.toContain('href="javascript:');
    expect(email.html).toContain("javascript:alert(1)");
  });

  it("groups common contacts separately from request details", () => {
    const email = buildRequestEmail({
      id: 43,
      source_form: "contact",
      source_page: "/contact/",
      name: "Анна Смирнова",
      phone: "+7 900 111-22-33",
      email: "anna@example.com",
      message: "Нужна консультация по парку.",
    }, config);

    expect(email.text).toContain("Контакты");
    expect(email.text).toContain("Суть обращения");
    expect(email.text.indexOf("Контакты")).toBeLessThan(email.text.indexOf("Анна Смирнова"));
    expect(email.text).toContain("Сообщение: Нужна консультация по парку.");
    expect(occurrences(email.text, "Анна Смирнова")).toBe(1);
    expect(occurrences(email.text, "anna@example.com")).toBe(1);
    expect(email.html).toContain("Контакты");
    expect(email.html).toContain("Суть обращения");
  });

  it("renders CMS answers with labels and omits already-shown contact answers", () => {
    const email = buildRequestEmail({
      id: 44,
      source_form: "shop_warranty",
      source_page: "/shop/warranty/",
      name: "Тестовый клиент",
      phone: "+7 900 000-00-56",
      email: "client@example.com",
      city: "Владивосток",
      form_answers: {
        name: "Тестовый клиент",
        email: "client@example.com",
        phone: "+7 900 000-00-56",
        region: "Владивосток",
        problem: "Проблема с поставкой.",
        customProject: "Парк карьерной техники",
        reviewWindow: "7 дней",
      },
      form_answer_labels: {
        name: "Имя",
        email: "Email",
        phone: "Телефон",
        region: "Регион",
        problem: "Опишите проблему",
        customProject: "Проект",
      },
    }, config);

    expect(email.text).toContain("Опишите проблему: Проблема с поставкой.");
    expect(email.text).toContain("Проект: Парк карьерной техники");
    expect(email.text).not.toContain("Ответы формы");
    expect(email.text).not.toContain('"problem"');
    expect(email.text).not.toContain('"name"');
    expect(email.text).toContain("Review window: 7 дней");
    expect(occurrences(email.text, "Тестовый клиент")).toBe(1);
    expect(occurrences(email.text, "client@example.com")).toBe(1);
    expect(occurrences(email.text, "+7 900 000-00-56")).toBe(1);
    expect(occurrences(email.text, "Владивосток")).toBe(1);
  });

  it("formats selection context as labeled rows rather than JSON", () => {
    const email = buildRequestEmail({
      id: 45,
      source_form: "tire_selection",
      selection_context: { tireSize: "12.00R20", axle: "Ведущая", region: "Хабаровск" },
    }, config);

    expect(email.text).toContain("Контекст подбора");
    expect(email.text).toContain("Tire size: 12.00R20");
    expect(email.text).toContain("Ось: Ведущая");
    expect(email.text).not.toContain('{"tireSize"');
    expect(email.text).not.toContain("\"axle\"");
  });

  it("formats procurement parameter lines without dropping free text", () => {
    const email = buildRequestEmail({
      id: 46,
      source_form: "procurement",
      message: [
        "Типоразмер: 12.00R20",
        "Количество: 6",
        "Ось: ведущая",
        "Регион: Омск",
        "Желаемый срок: декабрь",
        "Комментарий: Нужен расчёт для теста",
      ].join("\n"),
    }, config);

    expect(email.text).toContain("Типоразмер: 12.00R20");
    expect(email.text).toContain("Количество: 6");
    expect(email.text).toContain("Желаемый срок: декабрь");
    expect(email.text).toContain("Нужен расчёт для теста");
    expect(email.text).not.toContain("Комментарий: Комментарий:");
  });

  it("shows useful item details, resolves safe relative links, and escapes untrusted input", () => {
    const email = buildRequestEmail({
      id: 47,
      source_form: "product_quick_order",
      items: [{
        item_type: "shopProduct",
        item_name: "Колпачок <BIZON>",
        item_slug: "bizon-cap",
        variant_label: "Чёрный",
        quantity: 2,
        notes: "Защитить от <царапин>",
        url: "/shop/product/bizon-cap",
      }, {
        item_type: "tire",
        item_name: "DSR158",
        url: "https://www.bizontop.ru/models/tbr/dsr158",
      }, {
        item_type: "wheel",
        item_name: "Внешний адрес",
        url: "https://evil.example/phishing",
      }],
    }, { ...config, siteUrl: "https://www.bizontop.ru/" });

    expect(email.text).toContain("Товары");
    expect(email.text).toContain("Тип товара: Товар магазина");
    expect(email.text).toContain("Количество: 2");
    expect(email.html).toContain('href="https://www.bizontop.ru/shop/product/bizon-cap"');
    expect(email.html).toContain('href="https://www.bizontop.ru/models/tbr/dsr158"');
    expect(email.html).not.toContain('href="https://evil.example/');
    expect(email.html).toContain("Колпачок &lt;BIZON&gt;");
    expect(email.html).not.toContain("Колпачок <BIZON>");
    expect(email.html).not.toContain("Защитить от <царапин>");

    const unsafeUrl = buildRequestEmail({
      id: 48,
      items: [{ item_name: "Опасный товар", url: "javascript:alert(1)" }],
    }, config);
    expect(unsafeUrl.html).not.toContain('href="javascript:');

    const relativeWithoutOrigin = buildRequestEmail({
      id: 50,
      items: [{ item_name: "Товар", url: "/shop/product/item" }],
    }, config);
    expect(relativeWithoutOrigin.html).not.toContain('href="/shop/product/item"');
  });

  it.each(SOURCE_FORMS)("renders a readable source label for %s", ({ value }) => {
    const email = buildRequestEmail({ id: 49, source_form: value, source_page: "/test/" }, config);

    expect(email.text).toContain("Источник:");
    expect(email.text).not.toContain(`Источник: ${value}`);
    expect(email.text).toContain("Страница: /test/");
  });
});
