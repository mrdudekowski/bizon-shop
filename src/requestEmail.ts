export type RequestEmailItem = {
  item_type?: unknown;
  item_name?: unknown;
  item_slug?: unknown;
  variant_label?: unknown;
  quantity?: unknown;
  notes?: unknown;
  url?: unknown;
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
  form_answer_labels?: Record<string, string>;
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

type EmailField = { label: string; value: string; href?: string };
type EmailSection = { title: string; fields: EmailField[] };

const SOURCE_LABELS: Record<string, string> = {
  contact: "Форма контактов",
  tire_selection: "Подбор шин",
  wheel_selection: "Подбор дисков",
  branding: "Брендирование",
  supplier: "Стать поставщиком",
  delivery_quote: "Расчёт доставки",
  warranty: "Гарантия",
  shop_delivery: "Доставка BIZON Shop",
  shop_warranty: "Гарантия BIZON Shop",
  shop_supplier: "Поставщик BIZON Shop",
  product_quick_order: "Быстрый заказ",
  cart: "Корзина",
  tire_cart: "Корзина шин BIZON",
  shop_cart: "Корзина BIZON Shop",
  procurement: "Запрос по спецификации",
  hero_cta: "Первый экран",
  footer_cta: "Подвал сайта",
  custom: "Другое",
};

const KNOWN_FIELD_LABELS: Record<string, string> = {
  name: "Имя",
  contactname: "Контактное лицо",
  phone: "Телефон",
  email: "Email",
  companyname: "Компания",
  company: "Компания",
  companysite: "Сайт компании",
  region: "Регион",
  city: "Город",
  problem: "Проблема",
  comment: "Комментарий",
  message: "Сообщение",
  catalogfile: "Файл каталога",
  category: "Категория",
  size: "Типоразмер",
  quantity: "Количество",
  axle: "Ось",
  desiredterm: "Желаемый срок",
  attachmenturl: "Вложение",
};

const CONTACT_FIELDS: Array<[keyof RequestEmailData, string]> = [
  ["name", "Имя"],
  ["phone", "Телефон"],
  ["email", "Email клиента"],
  ["company_name", "Компания"],
  ["inn", "ИНН"],
  ["city", "Город / регион"],
  ["position", "Должность"],
  ["purchase_volume", "Объём закупки"],
  ["preferred_contact", "Предпочтительный способ связи"],
];

const PROCUREMENT_LABELS: Record<string, string> = {
  типоразмер: "Типоразмер",
  количество: "Количество",
  ось: "Ось",
  регион: "Регион",
  "желаемый срок": "Желаемый срок",
  комментарий: "Комментарий",
};

function valueText(value: unknown): string {
  if (value == null || value === "") return "";
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value.map(valueText).filter(Boolean).join(", ");
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => {
        const text = valueText(entry);
        return text ? `${readableFieldLabel(key)}: ${text}` : "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return String(value);
}

function answerRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    try {
      return answerRecord(JSON.parse(value));
    } catch {
      return value.trim() ? { answer: value } : {};
    }
  }
  if (value == null || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function readableFieldLabel(id: string, configuredLabels?: Record<string, string>): string {
  const configured = configuredLabels?.[id]?.trim();
  if (configured) return configured;
  const known = KNOWN_FIELD_LABELS[id.replace(/[_\s-]/g, "").toLowerCase()];
  if (known) return known;
  const words = id
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return words.length ? `${words[0]![0]!.toUpperCase()}${words[0]!.slice(1).toLowerCase()}${words.length > 1 ? ` ${words.slice(1).map((word) => word.toLowerCase()).join(" ")}` : ""}` : "Ответ";
}

function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? readableFieldLabel(source);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}

function safeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

function safeItemUrl(value: unknown, siteUrl?: string): string | null {
  const raw = valueText(value).trim();
  if (!raw) return null;
  const site = siteUrl ? safeHttpUrl(siteUrl) : null;
  if (!site) return null;
  const base = new URL(site);
  const absolute = safeHttpUrl(raw);
  if (absolute) {
    const resolved = new URL(absolute);
    return resolved.origin === base.origin ? resolved.href : null;
  }
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
  try {
    const resolved = new URL(raw, base.origin);
    return resolved.origin === base.origin ? resolved.href : null;
  } catch {
    return null;
  }
}

function answerContactKey(id: string): string | null {
  const normalized = id.replace(/[_\s-]/g, "").toLowerCase();
  if (normalized === "name" || normalized === "contactname") return "name";
  if (normalized === "phone") return "phone";
  if (normalized === "email") return "email";
  if (normalized === "companyname" || normalized === "company") return "company_name";
  if (normalized === "region" || normalized === "city") return "city";
  return null;
}

function formAnswerFields(data: RequestEmailData): EmailField[] {
  const answers = answerRecord(data.form_answers);
  return Object.entries(answers).flatMap(([id, value]) => {
    const text = valueText(value);
    if (!text) return [];
    const contactKey = answerContactKey(id);
    if (contactKey && valueText(data[contactKey as keyof RequestEmailData]) === text) return [];
    return [{ label: readableFieldLabel(id, data.form_answer_labels), value: text }];
  });
}

function selectionContextFields(value: unknown): EmailField[] {
  const context = answerRecord(value);
  return Object.entries(context).flatMap(([id, entry]) => {
    const text = valueText(entry);
    return text ? [{ label: readableFieldLabel(id), value: text }] : [];
  });
}

function procurementFields(message: string): EmailField[] {
  const fields: EmailField[] = [];
  const remaining: string[] = [];
  for (const line of message.split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator > 0) {
      const rawLabel = line.slice(0, separator).trim().toLowerCase();
      const label = PROCUREMENT_LABELS[rawLabel];
      const value = line.slice(separator + 1).trim();
      if (label && value) {
        fields.push({ label, value });
        continue;
      }
    }
    if (line.trim()) remaining.push(line.trim());
  }
  if (remaining.length) fields.push({ label: "Сообщение", value: remaining.join("\n") });
  return fields;
}

function itemTypeLabel(value: unknown): string {
  const type = valueText(value);
  if (type === "tire") return "Шина";
  if (type === "wheel") return "Диск";
  if (type === "shopProduct") return "Товар магазина";
  return type ? readableFieldLabel(type) : "Товар";
}

function itemSections(items: RequestEmailItem[], siteUrl?: string): Array<{ title: string; items: Array<{ fields: EmailField[]; name: string }> }> {
  if (items.length === 0) return [];
  return [{
    title: "Товары",
    items: items.map((item) => {
      const name = valueText(item.item_name) || valueText(item.item_slug) || "Товар";
      const href = safeItemUrl(item.url, siteUrl);
      const fields: EmailField[] = [
        { label: "Тип товара", value: itemTypeLabel(item.item_type) },
        { label: "Количество", value: valueText(item.quantity) || "1" },
      ];
      const variant = valueText(item.variant_label);
      const notes = valueText(item.notes);
      if (variant) fields.push({ label: "Размер / вариант", value: variant });
      if (notes) fields.push({ label: "Примечание", value: notes });
      const url = valueText(item.url);
      if (url) fields.push({ label: "Страница товара", value: url, ...(href ? { href } : {}) });
      return { name, fields };
    }),
  }];
}

function fieldText(field: EmailField): string {
  return `${field.label}: ${field.value}`;
}

function fieldHtml(field: EmailField): string {
  const value = escapeHtml(field.value).replace(/\r?\n/g, "<br>");
  const rendered = field.href
    ? `<a href="${escapeHtml(field.href)}" style="color:#c9472d;text-decoration:underline;word-break:break-word">${value}</a>`
    : `<span style="white-space:pre-wrap;word-break:break-word">${value}</span>`;
  return `<tr><td valign="top" style="padding:7px 12px 7px 0;color:#69717b;font-size:13px;line-height:1.5;width:38%">${escapeHtml(field.label)}</td><td valign="top" style="padding:7px 0;color:#20242a;font-size:14px;line-height:1.5">${rendered}</td></tr>`;
}

function sectionText(section: EmailSection): string {
  return `${section.title}\n${section.fields.map(fieldText).join("\n")}`;
}

function sectionHtml(section: EmailSection): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr><td colspan="2" style="padding:0 0 8px;color:#20242a;font-size:16px;font-weight:700">${escapeHtml(section.title)}</td></tr>${section.fields.map(fieldHtml).join("")}</table>`;
}

function itemSectionText(section: ReturnType<typeof itemSections>[number]): string {
  return `${section.title}\n${section.items.map(({ name, fields }, index) => `${index + 1}. ${name}\n${fields.map((field) => `   ${fieldText(field)}`).join("\n")}`).join("\n\n")}`;
}

function itemSectionHtml(section: ReturnType<typeof itemSections>[number]): string {
  const items = section.items.map(({ name, fields }, index) => {
    const renderedName = escapeHtml(name);
    return `<tr><td style="padding:12px;border:1px solid #e1e4e8;border-radius:8px"><div style="margin-bottom:7px;color:#20242a;font-size:14px;font-weight:700">${index + 1}. ${renderedName}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${fields.map(fieldHtml).join("")}</table></td></tr>`;
  }).join('<tr><td height="8" style="height:8px;font-size:1px;line-height:1px">&nbsp;</td></tr>');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr><td style="padding:0 0 8px;color:#20242a;font-size:16px;font-weight:700">${escapeHtml(section.title)}</td></tr>${items}</table>`;
}

function sectionContainerHtml(content: string): string {
  return `<tr><td style="padding:18px 22px;border-bottom:1px solid #eceef0">${content}</td></tr>`;
}

export function buildRequestEmail(
  data: RequestEmailData,
  config: { to: string; from: string; siteUrl?: string },
): RequestEmailMessage {
  const rendered = renderRequestNotification(data, config.siteUrl);
  const email = valueText(data.email);

  return {
    to: config.to,
    from: config.from,
    ...(email ? { replyTo: email } : {}),
    subject: rendered.title,
    text: rendered.content,
    html: rendered.html,
  };
}

export function buildRequestNotificationText(
  data: RequestEmailData,
  options: { siteUrl?: string } = {},
): string {
  return renderRequestNotification(data, options.siteUrl).content;
}

function renderRequestNotification(data: RequestEmailData, siteUrl?: string): { title: string; content: string; html: string } {
  const source = valueText(data.source_form);
  const message = valueText(data.message);
  const metadata: EmailField[] = [
    ...(valueText(data.created_at) ? [{ label: "Создана", value: valueText(data.created_at) }] : []),
    ...(source ? [{ label: "Источник", value: sourceLabel(source) }] : []),
    ...(valueText(data.source_page) ? [{ label: "Страница", value: valueText(data.source_page) }] : []),
  ];
  const contacts = CONTACT_FIELDS.flatMap(([key, label]) => {
    const value = valueText(data[key]);
    return value ? [{ label, value }] : [];
  });
  const details = source === "procurement" ? procurementFields(message) : message ? [{ label: "Сообщение", value: message }] : [];
  details.push(...formAnswerFields(data));
  const context = selectionContextFields(data.selection_context);
  const attachment = valueText(data.attachment_url);
  const requestSections: EmailSection[] = [
    ...(metadata.length ? [{ title: "Заявка", fields: metadata }] : []),
    ...(contacts.length ? [{ title: "Контакты", fields: contacts }] : []),
    ...(details.length ? [{ title: "Суть обращения", fields: details }] : []),
    ...(context.length ? [{ title: "Контекст подбора", fields: context }] : []),
    ...(attachment ? [{ title: "Файлы", fields: [{ label: "Вложение", value: attachment, ...(safeHttpUrl(attachment) ? { href: safeHttpUrl(attachment)! } : {}) }] }] : []),
  ];
  const tracking: EmailField[] = [
    ...(valueText(data.utm_source) ? [{ label: "UTM source", value: valueText(data.utm_source) }] : []),
    ...(valueText(data.utm_medium) ? [{ label: "UTM medium", value: valueText(data.utm_medium) }] : []),
    ...(valueText(data.utm_campaign) ? [{ label: "UTM campaign", value: valueText(data.utm_campaign) }] : []),
  ];
  const sections = [
    ...requestSections.map(sectionText),
    ...itemSections(data.items ?? [], siteUrl).map(itemSectionText),
    ...(tracking.length ? [sectionText({ title: "Источник перехода", fields: tracking })] : []),
  ];
  const id = valueText(data.id);
  const title = `Новая заявка Bizon #${id}`;
  const content = [title, ...sections].join("\n\n");
  const htmlSections = [
    ...requestSections.map((section) => sectionContainerHtml(sectionHtml(section))),
    ...itemSections(data.items ?? [], siteUrl).map((section) => sectionContainerHtml(itemSectionHtml(section))),
    ...(tracking.length ? [sectionContainerHtml(sectionHtml({ title: "Источник перехода", fields: tracking }))] : []),
  ].join("");
  const html = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f1f3f5" style="width:100%;margin:0;padding:24px 10px;background:#f1f3f5;border-collapse:collapse;font-family:Arial,Helvetica,sans-serif"><tr><td align="center"><table role="presentation" width="620" cellpadding="0" cellspacing="0" style="width:100%;max-width:620px;background:#ffffff;border:1px solid #e1e4e8;border-radius:12px;border-collapse:separate"><tr><td style="padding:24px 22px;background:#20242a;border-radius:12px 12px 0 0"><div style="margin-bottom:8px;color:#f05a37;font-size:12px;font-weight:700;letter-spacing:1.5px">BIZON</div><h1 style="margin:0;color:#ffffff;font-size:22px;line-height:1.3">${escapeHtml(title)}</h1></td></tr>${htmlSections}<tr><td style="padding:16px 22px;color:#7b828a;font-size:11px;line-height:1.5">Автоматическое уведомление с сайта Bizon.</td></tr></table></td></tr></table>`;
  return { title, content, html };
}
