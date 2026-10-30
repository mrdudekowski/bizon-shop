import type { StoredRequestInput } from "../insertRequest";
import type { ReadDatabase } from "../publishedRead";

export const FORM_FIELD_TYPES = ["text", "tel", "email", "url", "textarea"] as const;
export type FormFieldType = (typeof FORM_FIELD_TYPES)[number];

export type PageFormField = {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
};

export const PAGE_FORM_KEYS = [
  "become-a-supplier",
  "delivery-geography",
  "branding",
  "warranty",
  "delivery",
  "shop-delivery",
  "shop-warranty",
  "shop-become-a-supplier",
] as const;
export type PageFormKey = (typeof PAGE_FORM_KEYS)[number];

export type PageForm = {
  pageKey: PageFormKey;
  successMessage: string;
  /** Set only when a manager saved a label. Blank keeps the public button as «Отправить». */
  submitLabel?: string;
  fields: PageFormField[];
};

/** The editable part of a page form, as the admin draft carries it (same shape as `PageFormDraft` in admin types). */
type PageFormDraft = Pick<PageForm, "successMessage" | "submitLabel" | "fields">;

/** Public pages show these before a manager saves a row. A stored row replaces the whole form. */
const DEFAULT_PAGE_FORM: Partial<Record<PageFormKey, PageFormDraft>> = {
  branding: {
    successMessage: "Спасибо! Заявка получена. Мы свяжемся с вами, чтобы обсудить брендирование.",
    fields: [
      { id: "name", label: "Имя", type: "text", required: true },
      { id: "phone", label: "Телефон", type: "tel", required: true },
      { id: "email", label: "Email", type: "email", required: false },
      { id: "comment", label: "Комментарий", type: "textarea", required: true },
    ],
  },
  warranty: {
    successMessage: "Спасибо! Обращение получено. Мы свяжемся с вами по гарантии и возврату.",
    fields: [
      { id: "name", label: "Имя", type: "text", required: true },
      { id: "phone", label: "Телефон", type: "tel", required: true },
      { id: "email", label: "Email", type: "email", required: false },
      { id: "problem", label: "Опишите проблему", type: "textarea", required: true },
    ],
  },
};

export const isPageFormKey = (key: string): key is PageFormKey => (PAGE_FORM_KEYS as readonly string[]).includes(key);

/** Request field that bots fill. Supplier company site is `companySite`, never this key. */
const HONEYPOT_KEY = "website";

const MAX_ANSWER_LENGTH = 4000;

/** `delivery_quote` is the public delivery page. `/delivery-geography` redirects there. */
export const PAGE_KEY_BY_SOURCE_FORM = {
  supplier: "become-a-supplier",
  delivery_quote: "delivery",
  shop_delivery: "shop-delivery",
  shop_warranty: "shop-warranty",
  shop_supplier: "shop-become-a-supplier",
  branding: "branding",
  warranty: "warranty",
} as const satisfies Record<string, PageForm["pageKey"]>;

export type ConfiguredSourceForm = keyof typeof PAGE_KEY_BY_SOURCE_FORM;

export function isConfiguredSourceForm(value: unknown): value is ConfiguredSourceForm {
  return typeof value === "string" && Object.hasOwn(PAGE_KEY_BY_SOURCE_FORM, value);
}

export function answersFromFields(
  fields: PageFormField[],
  input: Record<string, string>,
): { answers: Record<string, string>; missing: string[] } {
  const answers: Record<string, string> = {};
  const missing: string[] = [];
  for (const field of fields) {
    if (field.id === HONEYPOT_KEY) continue;
    const value = Object.hasOwn(input, field.id) ? input[field.id] : "";
    if (value.trim()) answers[field.id] = value.trim().slice(0, MAX_ANSWER_LENGTH);
    else if (field.required) missing.push(field.id);
  }
  return { answers, missing };
}

/** Keeps only string values; the request body is untrusted JSON. */
export function stringValues(body: Record<string, unknown>): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === "string") values[key] = value;
  }
  return values;
}

/** An attachment URL is trusted only when we issued it, i.e. it lives under our public media base. */
export function trustedAttachmentUrl(url: string | undefined, publicBase: string | null): string | null {
  if (!url || !publicBase) return null;
  return url.startsWith(publicBase) ? url : null;
}

export function requestFromAnswers(
  answers: Record<string, string>,
  meta: Pick<StoredRequestInput, "sourceForm" | "sourcePage" | "sourceIpHash" | "userAgent" | "attachmentUrl">,
): StoredRequestInput {
  return {
    ...meta,
    name: answers.contactName ?? answers.name ?? "",
    companyName: answers.companyName,
    phone: answers.phone,
    email: answers.email,
    city: answers.region,
    formAnswers: answers,
  };
}

export async function loadPageForm(db: ReadDatabase, pageKey: PageFormKey): Promise<PageForm | null> {
  const [form] = await db.query("SELECT success_message, submit_label FROM page_forms WHERE page_key = $1", [pageKey]);
  if (!form) {
    const fallback = DEFAULT_PAGE_FORM[pageKey];
    return fallback ? { pageKey, ...fallback } : null;
  }
  const rows = await db.query(
    "SELECT id, label, field_type, required FROM page_form_fields WHERE page_key = $1 ORDER BY sort_order",
    [pageKey],
  );
  const submitLabel = typeof form.submit_label === "string" ? form.submit_label.trim() : "";
  return {
    pageKey,
    successMessage: String(form.success_message),
    ...(submitLabel ? { submitLabel } : {}),
    fields: rows.flatMap((row) => {
      const type = String(row.field_type);
      if (!(FORM_FIELD_TYPES as readonly string[]).includes(type)) return [];
      return [{ id: String(row.id), label: String(row.label), type: type as FormFieldType, required: row.required === true }];
    }),
  };
}

/** Branding and warranty edit as the public default. Any other form page edits empty until a row is stored. */
export async function readPageFormDraft(db: ReadDatabase, pageKey: PageFormKey): Promise<PageFormDraft> {
  const form = await loadPageForm(db, pageKey);
  return {
    successMessage: form?.successMessage ?? "",
    ...(form?.submitLabel ? { submitLabel: form.submitLabel } : {}),
    fields: form?.fields ?? [],
  };
}

/** Field ids are the keys of the stored answers, so they must be unique and must not collide with the honeypot. */
export function pageFormFieldsAreValid(fields: PageFormField[]): boolean {
  const ids = fields.map((field) => field.id.trim());
  return (
    ids.every((id) => id && id !== HONEYPOT_KEY) &&
    new Set(ids).size === ids.length &&
    fields.every((field) => (FORM_FIELD_TYPES as readonly string[]).includes(field.type))
  );
}

/** Upserts the form and replaces its fields in draft order. Run inside the page-save transaction. */
export async function writePageForm(db: ReadDatabase, pageKey: PageFormKey, form: PageFormDraft): Promise<void> {
  const submitLabel = form.submitLabel?.trim() || null;
  await db.query(
    `INSERT INTO page_forms (page_key, success_message, submit_label) VALUES ($1, $2, $3)
     ON CONFLICT (page_key) DO UPDATE SET success_message = EXCLUDED.success_message, submit_label = EXCLUDED.submit_label`,
    [pageKey, form.successMessage, submitLabel],
  );
  await db.query("DELETE FROM page_form_fields WHERE page_key = $1", [pageKey]);
  for (const [index, field] of form.fields.entries()) {
    await db.query(
      "INSERT INTO page_form_fields (page_key, id, sort_order, label, field_type, required) VALUES ($1, $2, $3, $4, $5, $6)",
      [pageKey, field.id, index, field.label, field.type, field.required],
    );
  }
}
