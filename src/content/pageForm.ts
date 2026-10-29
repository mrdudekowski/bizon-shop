import type { StoredRequestInput } from "../insertRequest";
import type { ReadDatabase } from "../publishedRead";

export type FormFieldType = "text" | "tel" | "email" | "url" | "textarea" | "file";

export type PageFormField = {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
};

export type PageForm = {
  pageKey: "become-a-supplier" | "delivery-geography";
  successMessage: string;
  fields: PageFormField[];
};

/** Request field that bots fill. Supplier company site is `companySite`, never this key. */
const HONEYPOT_KEY = "website";

const MAX_ANSWER_LENGTH = 4000;

export const PAGE_KEY_BY_SOURCE_FORM = {
  supplier: "become-a-supplier",
  delivery_quote: "delivery-geography",
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

export async function loadPageForm(db: ReadDatabase, pageKey: PageForm["pageKey"]): Promise<PageForm | null> {
  const [form] = await db.query("SELECT success_message FROM page_forms WHERE page_key = $1", [pageKey]);
  if (!form) return null;
  const rows = await db.query(
    "SELECT id, label, field_type, required FROM page_form_fields WHERE page_key = $1 ORDER BY sort_order",
    [pageKey],
  );
  return {
    pageKey,
    successMessage: String(form.success_message),
    fields: rows.map((row) => ({
      id: String(row.id),
      label: String(row.label),
      type: row.field_type as FormFieldType,
      required: row.required === true,
    })),
  };
}
