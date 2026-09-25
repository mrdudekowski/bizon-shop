import { createPageMetadata } from "@/lib/seo/metadata";
import { ROUTES } from "@/constants/navigation";
import { PlaceholderPage } from "@/components/catalog/PlaceholderPage";

export const metadata = createPageMetadata({
  title: "О компании",
  description:
    "BIZON — премиальный industrial-партнёр для fleet-операторов и владельцев тяжёлой техники.",
  path: ROUTES.about,
});

export default function AboutPage() {
  return (
    <PlaceholderPage
      title="О компании BIZON"
      description="Премиальная большегрузная резина и сервис для автопарков."
      breadcrumbs={[
        { href: ROUTES.home, label: "Главная" },
        { href: ROUTES.about, label: "О компании" },
      ]}
      body="BIZON поставляет шины для магистралей, карьеров и бездорожья. Полный контент раздела будет управляться через Payload CMS — история бренда, команда, сертификаты и партнёрские программы."
      ctaHref={ROUTES.contact}
      ctaLabel="Связаться с нами"
    />
  );
}
