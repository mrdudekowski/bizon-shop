import { CUSTOMER_COPY } from "./customerTemplateCopy";

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

type SiteProfileDatabase = {
  query(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]>;
};

const PARAGRAPH_SEPARATOR = "\n\n";

export const SITE_PROFILE_DEFAULTS = {
  phone: CUSTOMER_COPY.phone,
  email: CUSTOMER_COPY.email,
  address: CUSTOMER_COPY.address,
  channelsNote: CUSTOMER_COPY.channelsNote,
  legalSummary: CUSTOMER_COPY.legalSummary,
  priceNotice: CUSTOMER_COPY.priceNotice.join(PARAGRAPH_SEPARATOR),
  madeToOrderNotice: CUSTOMER_COPY.madeToOrderNotice.join(PARAGRAPH_SEPARATOR),
} as const;

export function visibleChannels(channels: SiteChannel[]): SiteChannel[] {
  return channels.filter((channel) => channel.enabled && channel.href.trim());
}

export function contactHref(kind: "phone" | "email", value: string): string | null {
  if (kind === "email") return value.includes("@") ? `mailto:${value.trim()}` : null;
  const phone = value.replace(/[^\d+]/g, "");
  return /\d/.test(phone) ? `tel:${phone}` : null;
}

/** A channel link is rendered as an anchor on the public site, so only empty or http(s) links are stored. */
export function siteChannelsAreValid(channels: SiteChannel[]): boolean {
  const ids = channels.map((channel) => channel.id.trim());
  return (
    ids.every(Boolean) &&
    new Set(ids).size === ids.length &&
    channels.every((channel) => channel.label.trim() && (!channel.href.trim() || /^https?:\/\//i.test(channel.href.trim())))
  );
}

/** Replaces phone, email, address and all channel rows; legal text and requisites are left untouched. */
export async function writeSiteProfileContacts(
  db: SiteProfileDatabase,
  contacts: Pick<SiteProfile, "phone" | "email" | "address" | "channels">,
): Promise<void> {
  await db.query(
    `INSERT INTO site_profile (id, phone, email, address, channels_note, legal_summary, price_notice, made_to_order_notice)
     VALUES (1, $1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET phone = EXCLUDED.phone, email = EXCLUDED.email, address = EXCLUDED.address`,
    [
      contacts.phone,
      contacts.email,
      contacts.address,
      SITE_PROFILE_DEFAULTS.channelsNote,
      SITE_PROFILE_DEFAULTS.legalSummary,
      SITE_PROFILE_DEFAULTS.priceNotice,
      SITE_PROFILE_DEFAULTS.madeToOrderNotice,
    ],
  );
  await db.query(`DELETE FROM site_profile_channels`);
  for (const [index, channel] of contacts.channels.entries()) {
    await db.query(
      `INSERT INTO site_profile_channels (id, sort_order, label, href, enabled) VALUES ($1, $2, $3, $4, $5)`,
      [channel.id.trim(), index, channel.label.trim(), channel.href.trim(), channel.enabled],
    );
  }
}

const asText = (value: unknown): string => (typeof value === "string" ? value : "");

export async function readSiteProfile(db: SiteProfileDatabase): Promise<SiteProfile> {
  const [profile] = await db.query(
    `SELECT phone, email, address, channels_note, legal_summary, price_notice, made_to_order_notice
     FROM site_profile WHERE id = 1`,
  );
  const channels = await db.query(
    `SELECT id, label, href, enabled FROM site_profile_channels ORDER BY sort_order, id`,
  );
  const requisites = await db.query(
    `SELECT id, label, value FROM site_profile_requisites ORDER BY sort_order, id`,
  );
  return {
    // ponytail: a database without the migrated row serves the template placeholders instead of failing the contact page.
    phone: profile ? asText(profile.phone) : SITE_PROFILE_DEFAULTS.phone,
    email: profile ? asText(profile.email) : SITE_PROFILE_DEFAULTS.email,
    address: profile ? asText(profile.address) : SITE_PROFILE_DEFAULTS.address,
    channelsNote: profile ? asText(profile.channels_note) : SITE_PROFILE_DEFAULTS.channelsNote,
    channels: channels.map((channel) => ({
      id: asText(channel.id),
      label: asText(channel.label),
      href: asText(channel.href),
      enabled: channel.enabled === true,
    })),
    legalSummary: profile ? asText(profile.legal_summary) : SITE_PROFILE_DEFAULTS.legalSummary,
    requisites: requisites.map((requisite) => ({
      id: asText(requisite.id),
      label: asText(requisite.label),
      value: asText(requisite.value),
    })),
    priceNotice: profile ? asText(profile.price_notice) : SITE_PROFILE_DEFAULTS.priceNotice,
    madeToOrderNotice: profile ? asText(profile.made_to_order_notice) : SITE_PROFILE_DEFAULTS.madeToOrderNotice,
  };
}
