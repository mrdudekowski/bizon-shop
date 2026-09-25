/** Public contact details — override via NEXT_PUBLIC_CONTACT_* in production. */
const DEFAULT_PHONE = "+7 (000) 000-00-00";
const DEFAULT_EMAIL = "info@bizontires.example";

export const SITE_CONTACT = {
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() || DEFAULT_PHONE,
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || DEFAULT_EMAIL,
  geography: "Работаем по всей стране — поставки для автопарков.",
} as const;

export function contactPhoneHref(phone: string = SITE_CONTACT.phone): string {
  const normalized = phone.replace(/[^\d+]/g, "");
  return normalized ? `tel:${normalized}` : `tel:${phone}`;
}

export function contactEmailHref(email: string = SITE_CONTACT.email): string {
  return `mailto:${email}`;
}
