/**
 * Public site profile served by the backend with the contact page (`siteProfile`).
 * The site cannot import from backend-app, so the type, contactSurfaceOf, and the visibility rules are copied here and
 * must keep the behavior of backend-app/src/content/siteProfile.ts.
 */
export type SiteChannel = {
  id: string;
  label: string;
  href: string;
  enabled: boolean;
};

export type SiteRequisite = { id: string; label: string; value: string };

export type ContactSurface = "form" | "card";

export type SiteProfile = {
  phone: string;
  email: string;
  address: string;
  channelsNote: string;
  channels: SiteChannel[];
  legalSummary: string;
  requisites: SiteRequisite[];
  priceNotice: string;
  madeToOrderNotice: string;
  /** Published with contacts. Anything other than "card" keeps the request forms. */
  contactSurface: ContactSurface;
};

/** Shown while the contact page has not been fetched; mirrors the sentences the backend seeds. */
export const PLACEHOLDER_SITE_PROFILE: SiteProfile = {
  phone: "Контактный номер будет опубликован позже.",
  email: "Контактный email будет опубликован позже.",
  address: "Адрес компании будет опубликован позже.",
  channelsNote: "Актуальные ссылки на каналы связи будут опубликованы позже.",
  channels: [],
  legalSummary: "Юридические реквизиты будут предоставлены позже.",
  requisites: [],
  priceNotice: "",
  madeToOrderNotice: "",
  contactSurface: "form",
};

/** A missing or unknown value stays on the form. Card mode is explicit. */
export function contactSurfaceOf(value: unknown): ContactSurface {
  return value === "card" ? "card" : "form";
}

/** Telegram, Max, then WhatsApp, and only when that channel is already visible in contacts. */
export function contactCardChannels(channels: SiteChannel[]): SiteChannel[] {
  const visible = new Map(visibleChannels(channels).map((channel) => [channel.id, channel]));
  return ["telegram", "max", "whatsapp"].flatMap((id) => {
    const channel = visible.get(id);
    return channel ? [channel] : [];
  });
}

export function visibleChannels(channels: SiteChannel[]): SiteChannel[] {
  return channels.filter((channel) => channel.enabled && channel.href.trim());
}

export function contactHref(kind: "phone" | "email", value: string): string | null {
  if (kind === "email") return value.includes("@") ? `mailto:${value.trim()}` : null;
  const phone = value.replace(/[^\d+]/g, "");
  return /\d/.test(phone) ? `tel:${phone}` : null;
}
