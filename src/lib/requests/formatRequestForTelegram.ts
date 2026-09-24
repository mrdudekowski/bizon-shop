import { formatRequestItems } from "./formatRequestItems";
import type { NormalizedRequest } from "./types";

function line(label: string, value: string | undefined): string | null {
  if (!value?.trim()) return null;
  return `${label}: ${value.trim()}`;
}

function formatUtm(data: NormalizedRequest): string | null {
  const lines = [
    line("source", data.utmSource),
    line("medium", data.utmMedium),
    line("campaign", data.utmCampaign),
    line("content", data.utmContent),
    line("term", data.utmTerm),
  ].filter(Boolean);

  if (!lines.length) return null;
  return `UTM:\n${lines.join("\n")}`;
}

export function formatRequestForTelegram(
  data: NormalizedRequest,
  adminRequestUrl?: string,
): string {
  return formatRequestPlainText(data, adminRequestUrl, { heading: "🦬 Новая заявка BIZON" });
}

export function formatRequestPlainText(
  data: NormalizedRequest,
  adminRequestUrl?: string,
  options?: { heading?: string },
): string {
  const blocks = [
    options?.heading ?? "Новая заявка BIZON",
    "",
    line("Источник", data.sourceForm),
    line("Страница", data.sourcePage),
    "",
    line("Клиент", data.name),
    line("Телефон", data.phone),
    line("Email", data.email),
    line("Город", data.city),
    "",
    line("Компания", data.companyName),
    line("ИНН", data.inn),
    line("Должность", data.position),
    "",
    line("Объём закупки", data.purchaseVolume),
    line("Способ связи", data.preferredContact),
    "",
    formatRequestItems(data.items),
    data.message ? `\nСообщение:\n${data.message}` : null,
    "",
    formatUtm(data),
    adminRequestUrl ? `\nЗаявка в Payload:\n${adminRequestUrl}` : null,
  ].filter(Boolean);

  return blocks.join("\n").trim();
}

export function buildAdminRequestUrl(requestId: string | number): string | undefined {
  const adminBase =
    process.env.PAYLOAD_ADMIN_URL?.trim() ||
    (process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/admin`
      : "");

  if (!adminBase) return undefined;
  return `${adminBase.replace(/\/$/, "")}/collections/requests/${requestId}`;
}
