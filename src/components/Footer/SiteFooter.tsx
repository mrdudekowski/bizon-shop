import Link from "next/link";

import { SITE_CONTACT, contactEmailHref, contactPhoneHref } from "@/constants/contact";
import { ROUTES } from "@/constants/navigation";
import { SiteArrow } from "@/components/SiteArrow/SiteArrow";

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
          { href: ROUTES.peopleStories, label: "People Stories" },
          { href: ROUTES.supplier, label: "Стать поставщиком" },
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
          { href: "/shop/delivery-and-returns", label: "Доставка и возврат" },
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
}: {
  surface: FooterSurface;
  catalogLinks?: FooterLink[];
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
  const hasPhone = !SITE_CONTACT.phone.includes("(000)");
  const hasEmail = !SITE_CONTACT.email.endsWith(".example");

  return (
    <footer className={styles.footer} data-site-footer={surface}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <strong className={styles.wordmark} translate="no">{config.wordmark}</strong>
          <p>{config.description}</p>
          <Link href={config.primaryLink.href}>{config.primaryLink.label}</Link>
        </div>

        {sections.map((section) => (
          <nav className={styles.nav} aria-label={section.label} key={section.label}>
            <p>{section.label}</p>
            {section.links.map((link) => (
              <Link href={link.href} key={link.href}>
                {link.label}
                {link.href === "/" && surface === "shop" ? <SiteArrow direction="ne" /> : null}
              </Link>
            ))}
          </nav>
        ))}

        <div className={styles.contact}>
          <p>Контакты</p>
          <Link href={ROUTES.contact}>Связаться</Link>
          {hasPhone ? <a href={contactPhoneHref()}>{SITE_CONTACT.phone}</a> : null}
          {hasEmail ? <a href={contactEmailHref()}>{SITE_CONTACT.email}</a> : null}
          {!hasPhone && !hasEmail ? <span>Контакты будут опубликованы после подтверждения.</span> : null}
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
