import { ServicePage } from "@/components/content/ServicePage";
import { PREMIUM_MEDIA } from "@/constants/images";
import { ROUTES } from "@/constants/navigation";
import { getPublishedStubOverlay } from "@/lib/content/getPageContent";
import { createPageMetadata } from "@/lib/seo/metadata";

const fallbackDescription =
  "Начните диалог о поставках, ассортименте и работе с профессиональным рынком грузовых шин.";

export async function generateMetadata() {
  const page = await getPublishedStubOverlay("become-a-supplier");
  return createPageMetadata({
    title: page?.seoTitle || "Стать поставщиком",
    description: page?.seoDescription || fallbackDescription,
    path: "/become-a-supplier",
  });
}

export default async function BecomeASupplierPage() {
  const page = await getPublishedStubOverlay("become-a-supplier");
  return (
    <ServicePage
      kicker={page?.hero.eyebrow || "Партнёрство"}
      title={page?.hero.title || "Стать поставщиком"}
      description={page?.hero.lead || fallbackDescription}
      breadcrumbs={[
        { href: ROUTES.home, label: "Главная" },
        { href: ROUTES.supplier, label: "Стать поставщиком" },
      ]}
      media={{
        src: page?.hero.imageUrl || PREMIUM_MEDIA.mixedService,
        alt: page?.hero.imageAlt || "Техника в смешанных условиях эксплуатации",
      }}
      featuresHeading="Как проходит первичное обращение"
      features={[
        {
          title: "Расскажите о компании",
          text: "Укажите регион, направление работы и профиль клиентов — это поможет подготовить предметный ответ.",
        },
        {
          title: "Обсудим формат",
          text: "Согласуем номенклатуру, потребности автопарков и возможный формат сотрудничества.",
        },
        {
          title: "Подготовим следующий шаг",
          text: "Менеджер свяжется, чтобы уточнить детали и определить дальнейший порядок работы.",
        },
      ]}
      proof={{
        src: PREMIUM_MEDIA.severeService,
        alt: "Тяжёлые условия эксплуатации коммерческой техники",
        title: "Работаем с профессиональным рынком",
        text: "Заявка не создаёт обязательств автоматически: коммерческие условия и регионы подтверждаются отдельно.",
      }}
      cta={{
        href: `${ROUTES.contact}?subject=supplier`,
        label: "Оставить заявку",
      }}
    />
  );
}
