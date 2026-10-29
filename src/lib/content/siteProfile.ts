/**
 * Public site profile served by the backend with the contact page (`siteProfile`).
 * The site cannot import from backend-app, so the type and the two visibility rules are copied here and
 * must keep the behavior of backend-app/src/content/siteProfile.ts.
 */
export type SiteChannel = {
  id: string;
  label: string;
  href: string;
  enabled: boolean;
};

export type SiteRequisite = { id: string; label: string; value: string };

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
};

export function visibleChannels(channels: SiteChannel[]): SiteChannel[] {
  return channels.filter((channel) => channel.enabled && channel.href.trim());
}

export function contactHref(kind: "phone" | "email", value: string): string | null {
  if (kind === "email") return value.includes("@") ? `mailto:${value.trim()}` : null;
  const phone = value.replace(/[^\d+]/g, "");
  return /\d/.test(phone) ? `tel:${phone}` : null;
}
