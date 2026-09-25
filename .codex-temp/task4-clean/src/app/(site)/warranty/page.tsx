import { createPageMetadata } from "@/lib/seo/metadata";
import { ROUTES } from "@/constants/navigation";
import { PlaceholderPage } from "@/components/catalog/PlaceholderPage";

export const metadata = createPageMetadata({
  title: "Гарантия",
  description:
    "Условия гарантии BIZON на большегрузную резину — поддержка fleet-операторов.",
  path: ROUTES.warranty,
});

export default function WarrantyPage() {
  return (
    <PlaceholderPage
      title="Гарантия"
      description="Условия гарантийного обслуживания и поддержки автопарков."
      breadcrumbs={[
        { href: ROUTES.home, label: "Главная" },
        { href: ROUTES.warranty, label: "Гарантия" },
      ]}
      body="Раздел с условиями гарантии, процедурой обращения и документами будет опубликован после интеграции Payload CMS. Для вопросов по гарантии свяжитесь с нашей командой."
      ctaHref={ROUTES.contact}
      ctaLabel="Задать вопрос"
    />
  );
}
