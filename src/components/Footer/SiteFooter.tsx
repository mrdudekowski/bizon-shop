import Link from "next/link";

import { messengerMark } from "@/components/brand/messengerMark";
import { ROUTES } from "@/constants/navigation";
import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import {
  PLACEHOLDER_SITE_PROFILE,
  contactHref,
  visibleChannels,
  type SiteProfile,
} from "@/lib/content/siteProfile";

import styles from "./Footer.module.css";

type FooterSurface = "main" | "shop";

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
  primaryLink?: FooterLink;
  sections: FooterSection[];
  copyright: string;
  note: string;
};

const FOOTER_CONFIG: Record<FooterSurface, FooterConfig> = {
  main: {
    wordmark: "BIZON",
    description: "Шины для коммерческого транспорта и тяжёлой техники.",
    sections: [
      {
        label: "Компания",
        links: [
          { href: ROUTES.about, label: "О компании" },
          { href: ROUTES.tireIq, label: "Tire IQ" },
          { href: ROUTES.supplier, label: "Стать поставщиком" },
          { href: ROUTES.delivery, label: "Доставка" },
          { href: ROUTES.payment, label: "Оплата" },
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
          { href: ROUTES.shopDelivery, label: "Доставка" },
          { href: ROUTES.shopPayment, label: "Оплата" },
          { href: ROUTES.shopWarranty, label: "Гарантия и возврат" },
          { href: ROUTES.shopSupplier, label: "Стать поставщиком" },
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
          {config.primaryLink ? <Link href={config.primaryLink.href}>{config.primaryLink.label}</Link> : null}
        </div>

        {sections.map((section) => (
          <div className={styles.footerSection} key={section.label}>
            <nav className={styles.nav} aria-label={section.label}>
              <p>{section.label}</p>
              {section.links.map((link) => (
                <Link href={link.href} key={link.href}>
                  {link.label}
                  {link.href === "/" && surface === "shop" ? <SiteArrow direction="ne" /> : null}
                </Link>
              ))}
            </nav>
          </div>
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
                const icon = messengerMark(channel.id);
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
            <Link href={surface === "shop" ? ROUTES.shopWarranty : ROUTES.warranty}>Гарантия и возврат</Link>
            <Link href={ROUTES.privacyPolicy}>Политика конфиденциальности</Link>
          </nav>
          <span>© {year} {config.copyright}</span>
          <span>{config.note}</span>
        </div>
      </div>
    </footer>
  );
}
