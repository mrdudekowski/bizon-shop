import { ServicePage } from "@/components/content/ServicePage";
import { PREMIUM_MEDIA } from "@/constants/images";
import { ROUTES } from "@/constants/navigation";
import { getPublishedStubOverlay } from "@/lib/content/getPageContent";
import { createPageMetadata } from "@/lib/seo/metadata";

const fallbackDescription =
  "Единая визуальная программа для корпоративного парка: от постановки задачи до согласованной поставки.";

export async function generateMetadata() {
  const page = await getPublishedStubOverlay("branding");
  return createPageMetadata({
    title: page?.seoTitle || "Индивидуальное брендирование",
    description: page?.seoDescription || fallbackDescription,
    path: "/branding",
  });
}

export default async function BrandingPage() {
  const page = await getPublishedStubOverlay("branding");
  return (
    <ServicePage
      kicker={page?.hero.eyebrow || "BIZON Business"}
      title={page?.hero.title || "Индивидуальное брендирование"}
      description={page?.hero.lead || fallbackDescription}
      breadcrumbs={[
        { href: ROUTES.home, label: "Главная" },
        { href: ROUTES.branding, label: "Брендирование" },
      ]}
      media={{
        src: page?.hero.imageUrl || PREMIUM_MEDIA.fleetManager,
        alt: page?.hero.imageAlt || "Корпоративный автопарк BIZON",
      }}
      featuresHeading="Как начинается проект"
      features={[
        {
          title: "Задача и сценарий эксплуатации",
          text: "Собираем вводные о технике, условиях работы и целях брендирования.",
        },
        {
          title: "Подбор решения",
          text: "Формируем предложение на основе доступной номенклатуры и согласованных параметров проекта.",
        },
        {
          title: "План реализации",
          text: "После уточнения исходных данных согласуем объём, сроки и дальнейший порядок работы.",
        },
      ]}
      proof={{
        src: PREMIUM_MEDIA.mounting,
        alt: "Работа с шиной в сервисной зоне",
        title: "Маркировка как часть рабочей поставки",
        text: "Брендирование обсуждается вместе с подбором и логистикой — без обещаний сроков до проверки исходных данных.",
      }}
      cta={{
        href: `${ROUTES.contact}?subject=branding`,
        label: "Обсудить проект",
      }}
    />
  );
}
