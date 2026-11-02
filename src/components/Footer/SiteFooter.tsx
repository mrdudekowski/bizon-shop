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

function BrandIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={22}
      height={22}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/**
 * Stroke marks from Hugeicons (MIT), one weight on a 24 grid.
 * MAX is absent from that set: the path is the official symbol from the MAX
 * brandbook, scaled into the same grid. vectorEffect keeps the 1.5 stroke
 * after the scale.
 */
const MESSENGER_ICONS: Record<string, ReactNode> = {
  telegram: (
    <BrandIcon>
      <path d="m11.985 15.408l3.242 3.686c1.2 1.365 1.801 2.048 2.43 1.881c.628-.166.844-1.064 1.275-2.861l2.39-9.968c.665-2.768.997-4.151.259-4.834s-2.017-.175-4.575.84L5.14 8.865c-2.046.813-3.069 1.219-3.134 1.917a1 1 0 0 0 0 .214c.063.699 1.084 1.108 3.128 1.927c.925.371 1.388.557 1.72.912q.056.06.108.124c.306.38.436.88.697 1.876l.489 1.867c.253.97.38 1.456.713 1.522s.622-.336 1.201-1.141zm0 0l-.317-.33c-.362-.378-.543-.566-.543-.8s.18-.423.543-.8l3.573-3.724" />
    </BrandIcon>
  ),
  whatsapp: (
    <BrandIcon>
      <path strokeLinejoin="round" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12c0 1.379.28 2.693.784 3.888c.279.66.418.99.436 1.24c.017.25-.057.524-.204 1.073L2 22l3.799-1.016c.549-.147.823-.22 1.073-.204c.25.018.58.157 1.24.436A10 10 0 0 0 12 22Z" />
      <path d="m8.588 12.377l.871-1.081c.367-.456.82-.88.857-1.488c.008-.153-.1-.841-.315-2.218C9.916 7.049 9.41 7 8.973 7c-.57 0-.855 0-1.138.13c-.358.163-.725.622-.806 1.007c-.064.305-.016.515.079.935c.402 1.783 1.347 3.544 2.811 5.009c1.465 1.464 3.226 2.409 5.01 2.811c.42.095.629.143.934.079c.385-.08.844-.448 1.008-.806c.129-.283.129-.568.129-1.138c0-.438-.049-.943-.59-1.028c-1.377-.216-2.065-.323-2.218-.315c-.607.036-1.032.49-1.488.857l-1.081.87" />
    </BrandIcon>
  ),
  max: (
    <BrandIcon>
      <path
        transform="translate(1.6 0.8) scale(0.205)"
        vectorEffect="non-scaling-stroke"
        d="M50.76 0c27.53 0 49.12 22.34 49.12 49.89S77.61 99.23 51.02 99.23c-9.43 0-14.01-1.33-21.37-6.54-.5-.36-1.2-.26-1.63.19-5.66 6.04-20.17 10.28-20.83 2.03C7.19 80.53 0 71.18 0 49.61 0 21.3 23.22 0 50.76 0Z"
      />
    </BrandIcon>
  ),
  vk: (
    <BrandIcon>
      <path d="M2 5.5h3.5c0 8 4.5 9 4.5 9l.002-9h3.5l-.003 5c4.5-2 5-5 5-5H22s-1 4.5-4.906 6.653C19.11 13.351 21.268 15.331 22 18.5h-3.5s-1-3-5-4.5l.002 4.5C1.887 18.5 2.002 7.5 2 5.5" />
    </BrandIcon>
  ),
  instagram: (
    <BrandIcon>
      <path d="M3 12c0-4.243 0-6.364 1.318-7.682S7.758 3 12 3s6.364 0 7.682 1.318S21 7.758 21 12s0 6.364-1.318 7.682S16.242 21 12 21s-6.364 0-7.682-1.318S3 16.242 3 12" />
      <path d="M16 12a4 4 0 1 1-8 0a4 4 0 0 1 8 0m1.375-5.25h-.125m.25 0a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0" />
    </BrandIcon>
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
          { href: ROUTES.shopCart, label: "Корзина" },
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
