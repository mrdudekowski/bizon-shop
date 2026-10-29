import type { ReactNode } from "react";
import Link from "next/link";

import { ROUTES } from "@/constants/navigation";
import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import { ResponsiveDisclosure } from "@/components/content/ResponsiveDisclosure";
import {
  PLACEHOLDER_SITE_PROFILE,
  contactHref,
  visibleChannels,
  type SiteProfile,
} from "@/lib/content/siteProfile";

import styles from "./Footer.module.css";

type FooterSurface = "main" | "shop";
/** Channel ids that keep a brand icon; every other id renders as a text link with its label. */
const MESSENGER_ICONS: Record<string, ReactNode> = {
  telegram: (
      <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden="true">
        <path d="M21.4 3.4 2.7 10.6c-.8.3-.8 1.4 0 1.7l4.7 1.6 1.8 5.6c.2.6 1 .8 1.4.3l2.6-2.7 4.9 3.6c.6.4 1.5.1 1.7-.7L22.9 4.7c.2-.9-.7-1.6-1.5-1.3ZM9.4 13.7l8.5-5.3c.2-.1.4.1.2.3l-7 6.5-.3 3.2-1.4-4.7Z" />
      </svg>
  ),
  whatsapp: (
      <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden="true">
        <path d="M12 2a9.9 9.9 0 0 0-8.5 15l-1.3 4.8 4.9-1.3A9.9 9.9 0 1 0 12 2Zm5.6 14c-.2.7-1.3 1.3-1.8 1.4-.5.1-1.1.1-1.8-.1a16.4 16.4 0 0 1-5.6-3.7c-1.6-1.8-2.4-3.5-2.4-4.6 0-1.1.6-1.7 1.1-2 .3-.2.7-.2.9-.2h.6c.2 0 .5 0 .7.5.3.6.9 2.1 1 2.3.1.2.1.4 0 .6-.1.2-.2.3-.4.5l-.4.5c-.2.2-.3.4-.1.7.2.4.9 1.5 2 2.4 1.4 1.2 2.5 1.6 2.9 1.8.3.1.6.1.8-.1.2-.3.9-1.1 1.2-1.4.2-.3.5-.3.8-.2.3.1 2 .9 2.3 1.1.3.2.5.3.6.5.1.1.1.8-.1 1.5Z" />
      </svg>
  ),
  max: (
      <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2.5" y="4" width="19" height="16" rx="4.5" />
        <path d="M6.8 15.5V8.5l5.2 4.4 5.2-4.4v7" />
      </svg>
  ),
  vk: (
      <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden="true">
        <path d="M13.2 17.5c-6.2 0-9.8-4.3-9.9-11.4h3.1c.1 5.2 2.4 7.4 4.2 7.9V6.1h2.9v4.5c1.8-.2 3.7-2.2 4.3-4.5h2.9c-.5 2.8-2.5 4.8-3.9 5.6 1.4.7 3.7 2.4 4.5 5.8h-3.2c-.7-2.2-2.4-3.9-4.7-4.1v4.1h-.2Z" />
      </svg>
  ),
  instagram: (
      <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
  ),
};

type FooterLink = {
  href: string;
  label: string;
};

type FooterSection = {
  label: string;
  links: FooterLink[];
};

type FooterConfig = {
  wordmark: string;
  description: string;
  primaryLink: FooterLink;
  sections: FooterSection[];
  copyright: string;
  note: string;
};

const FOOTER_CONFIG: Record<FooterSurface, FooterConfig> = {
  main: {
    wordmark: "BIZON",
    description: "Шины для коммерческого транспорта и тяжёлой техники.",
    primaryLink: { href: ROUTES.models, label: "Каталог шин" },
    sections: [
      {
        label: "Компания",
        links: [
          { href: ROUTES.about, label: "О компании" },
          { href: ROUTES.tireIq, label: "Tire IQ" },
          { href: ROUTES.supplier, label: "Стать поставщиком" },
          { href: ROUTES.deliveryGeography, label: "География поставок" },
        ],
      },
      {
        label: "Сервисы",
        links: [
          { href: ROUTES.models, label: "Каталог шин" },
          { href: ROUTES.branding, label: "Брендирование" },
          { href: ROUTES.shop, label: "BIZON Shop" },
        ],
      },
    ],
    copyright: "BIZON Tires",
    note: "Для профессионального применения",
  },
  shop: {
    wordmark: "BIZON SHOP",
    description: "Кованые диски под заказ и lifestyle-товары BIZON.",
    primaryLink: { href: "/shop#wheels", label: "Выбрать диски" },
    sections: [
      {
        label: "Каталог",
        links: [
          { href: "/shop/wheels/forged", label: "BIZON Forged" },
          { href: "/shop/categories", label: "Все категории" },
        ],
      },
      {
        label: "Помощь",
        links: [
          { href: "/cart", label: "Корзина" },
          { href: "/shop/delivery-and-returns", label: "Оплата, доставка и возврат" },
          { href: "/", label: "BIZON Tires" },
        ],
      },
    ],
    copyright: "BIZON Shop",
    note: "Изготовление и наличие подтверждает специалист",
  },
};

export function SiteFooter({
  surface,
  catalogLinks,
  siteProfile,
}: {
  surface: FooterSurface;
  catalogLinks?: FooterLink[];
  siteProfile?: SiteProfile | null;
}) {
  const config = FOOTER_CONFIG[surface];
  const sections =
    surface === "shop" && catalogLinks?.length
      ? config.sections.map((section) =>
          section.label === "Каталог"
            ? {
                ...section,
                links: [
                  { href: "/shop/wheels/forged", label: "BIZON Forged" },
                  ...catalogLinks.filter((link) => link.href !== "/shop/categories"),
                  { href: "/shop/categories", label: "Все категории" },
                ],
              }
            : section,
        )
      : config.sections;
  const year = new Date().getFullYear();
  const profile = siteProfile ?? PLACEHOLDER_SITE_PROFILE;
  const channels = visibleChannels(profile.channels);
  const contactRows = [
    { label: "Телефон", value: profile.phone.trim() || PLACEHOLDER_SITE_PROFILE.phone, href: contactHref("phone", profile.phone) },
    { label: "Email", value: profile.email.trim() || PLACEHOLDER_SITE_PROFILE.email, href: contactHref("email", profile.email) },
    { label: "Адрес", value: profile.address.trim() || PLACEHOLDER_SITE_PROFILE.address, href: null },
  ];

  return (
    <footer className={styles.footer} data-site-footer={surface}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <strong className={styles.wordmark} translate="no">{config.wordmark}</strong>
          <p>{config.description}</p>
          <Link href={config.primaryLink.href}>{config.primaryLink.label}</Link>
        </div>

        {sections.map((section) => (
          <ResponsiveDisclosure
            className={styles.footerDisclosure}
            summary={section.label}
            key={section.label}
          >
            <nav className={styles.nav} aria-label={section.label}>
              <p>{section.label}</p>
              {section.links.map((link) => (
                <Link href={link.href} key={link.href}>
                  {link.label}
                  {link.href === "/" && surface === "shop" ? <SiteArrow direction="ne" /> : null}
                </Link>
              ))}
            </nav>
          </ResponsiveDisclosure>
        ))}

        <div className={styles.contact}>
          <p>Контакты</p>
          <Link href={ROUTES.contact}>Связаться</Link>
          {contactRows.map((row) => (
            <div className={styles.contactRow} key={row.label}>
              <span className={styles.contactLabel}>{row.label}</span>
              {row.href ? <a href={row.href}>{row.value}</a> : <span>{row.value}</span>}
            </div>
          ))}
          {channels.length > 0 ? (
            <div className={styles.messengers} aria-label="Мессенджеры и соцсети">
              {channels.map((channel) => {
                const icon = MESSENGER_ICONS[channel.id];
                return (
                  <a
                    key={channel.id}
                    href={channel.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={icon ? styles.messengerLink : styles.messengerTextLink}
                    aria-label={icon ? channel.label : undefined}
                    title={channel.label}
                  >
                    {icon ?? channel.label}
                  </a>
                );
              })}
            </div>
          ) : (
            <span>{profile.channelsNote}</span>
          )}
        </div>

        <div className={styles.legal}>
          <nav aria-label="Юридическая информация">
            <Link href={ROUTES.warranty}>Гарантия</Link>
            <Link href={ROUTES.privacyPolicy}>Политика конфиденциальности</Link>
          </nav>
          <span>© {year} {config.copyright}</span>
          <span>{config.note}</span>
        </div>
      </div>
    </footer>
  );
}
