export type RequestEmailItem = {
  item_name?: unknown;
  item_slug?: unknown;
  variant_label?: unknown;
  quantity?: unknown;
  notes?: unknown;
};

export type RequestEmailData = {
  id: unknown;
  created_at?: unknown;
  source_form?: unknown;
  source_page?: unknown;
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  city?: unknown;
  company_name?: unknown;
  inn?: unknown;
  position?: unknown;
  purchase_volume?: unknown;
  preferred_contact?: unknown;
  message?: unknown;
  selection_context?: unknown;
  form_answers?: unknown;
  attachment_url?: unknown;
  utm_source?: unknown;
  utm_medium?: unknown;
  utm_campaign?: unknown;
  items?: RequestEmailItem[];
};

export type RequestEmailMessage = {
  to: string;
  from: string;
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
};

const LABELS: Record<string, string> = {
  id: "Номер заявки", created_at: "Создана", source_form: "Источник", source_page: "Страница",
  name: "Имя", phone: "Телефон", email: "Email клиента", city: "Город", company_name: "Компания",
  inn: "ИНН", position: "Должность", purchase_volume: "Объём закупки", preferred_contact: "Предпочтительный способ связи",
  message: "Сообщение", selection_context: "Контекст подбора", form_answers: "Ответы формы",
  attachment_url: "Вложение", utm_source: "UTM source", utm_medium: "UTM medium", utm_campaign: "UTM campaign",
};

const SOURCE_LABELS: Record<string, string> = {
  contact: "Форма контактов", tire_selection: "Подбор шин", wheel_selection: "Подбор дисков",
  branding: "Брендирование", supplier: "Стать поставщиком", delivery_quote: "Расчёт доставки",
  warranty: "Гарантия", shop_delivery: "Доставка BIZON Shop", shop_warranty: "Гарантия BIZON Shop",
  shop_supplier: "Поставщик BIZON Shop", product_quick_order: "Быстрый заказ", cart: "Корзина",
  tire_cart: "Корзина шин BIZON", shop_cart: "Корзина BIZON Shop", procurement: "Запрос по спецификации",
  hero_cta: "Первый экран", footer_cta: "Подвал сайта", custom: "Другое",
};

function valueText(value: unknown): string {
  if (value == null || value === "") return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

function safeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

export function buildRequestEmail(data: RequestEmailData, config: { to: string; from: string }): RequestEmailMessage {
  const fields = Object.entries(LABELS)
    .map(([key, label]) => ({ key, label, value: valueText(data[key as keyof RequestEmailData]) }))
    .map((field) => field.key === "source_form"
      ? { ...field, value: SOURCE_LABELS[field.value] ?? field.value }
      : field)
    .filter(({ value }) => value.length > 0);
  const items = (data.items ?? []).map((item, index) => {
    const parts = [valueText(item.item_name), valueText(item.variant_label), `количество: ${valueText(item.quantity) || "1"}`, valueText(item.notes)]
      .filter(Boolean);
    return `${index + 1}. ${parts.join(" · ")}`;
  });
  const lines = ["Новая заявка Bizon", ...fields.map(({ label, value }) => `${label}: ${value}`)];
  if (items.length) lines.push("Позиции:", ...items);
  const html = `<h1>Новая заявка Bizon #${escapeHtml(valueText(data.id))}</h1><dl>${fields.map(({ label, value, key }) => {
    const attachmentUrl = key === "attachment_url" ? safeHttpUrl(value) : null;
    const rendered = attachmentUrl
      ? `<a href="${escapeHtml(attachmentUrl)}">Открыть вложение</a>`
      : `<pre style="white-space:pre-wrap;margin:0">${escapeHtml(value)}</pre>`;
    return `<dt><strong>${escapeHtml(label)}</strong></dt><dd>${rendered}</dd>`;
  }).join("")}</dl>${items.length ? `<h2>Позиции</h2><ol>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>` : ""}`;
  const email = valueText(data.email);
  return {
    to: config.to,
    from: config.from,
    ...(email ? { replyTo: email } : {}),
    subject: `Новая заявка Bizon #${valueText(data.id)}`,
    text: lines.join("\n\n"),
    html,
  };
}
