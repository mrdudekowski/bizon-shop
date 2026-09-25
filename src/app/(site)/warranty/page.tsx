import { DemoContentNotice } from "@/components/content/DemoContentNotice";
import { ServicePage } from "@/components/content/ServicePage";
import { PREMIUM_MEDIA } from "@/constants/images";
import { ROUTES } from "@/constants/navigation";
import { getPublishedStubOverlay } from "@/lib/content/getPageContent";
import { createPageMetadata } from "@/lib/seo/metadata";

const fallbackDescription =
  "Порядок первичного обращения по гарантийному вопросу. Финальные сроки и объём условий подтверждает поставщик.";

export async function generateMetadata() {
  const page = await getPublishedStubOverlay("warranty");
  return createPageMetadata({
    title: page?.seoTitle || "Гарантия",
    description: page?.seoDescription || fallbackDescription,
    path: ROUTES.warranty,
  });
}

export default async function WarrantyPage() {
  const page = await getPublishedStubOverlay("warranty");
  return (
    <ServicePage
      kicker={page?.hero.eyebrow || "Поддержка"}
      title={page?.hero.title || "Гарантия и обращение"}
      description={page?.hero.lead || fallbackDescription}
      breadcrumbs={[
        { href: ROUTES.home, label: "Главная" },
        { href: ROUTES.warranty, label: "Гарантия" },
      ]}
      media={{
        src: page?.hero.imageUrl || PREMIUM_MEDIA.inspection,
        alt: page?.hero.imageAlt || "Проверка протектора шины",
      }}
      notice={
        <DemoContentNotice>
          Пример ниже не устанавливает срок или объём гарантии. Перед запуском его заменяют условия
          поставщика и подтверждающие документы.
        </DemoContentNotice>
      }
      featuresHeading="Три шага для первичной проверки"
      features={[
        {
          title: "Зафиксируйте данные",
          text: "Подготовьте модель и размер шины, дату и место приобретения, пробег, положение на технике и описание ситуации.",
        },
        {
          title: "Приложите материалы",
          text: "Сделайте фотографии шины, маркировки и зоны проверки. Не утилизируйте изделие до ответа менеджера.",
        },
        {
          title: "Отправьте запрос",
          text: "Опишите случай в форме контактов. Менеджер вернётся с перечнем документов и дальнейшим порядком рассмотрения.",
        },
      ]}
      proof={{
        src: PREMIUM_MEDIA.consultation,
        alt: "Консультация специалиста BIZON",
        title: "Что обычно фиксируется в гарантии",
        text: "В финальной версии указывают продавца или поставщика, модели, срок и объём гарантии, исключения, процедуру экспертизы и каналы обращения.",
      }}
      cta={{
        href: `${ROUTES.contact}?subject=warranty`,
        label: "Задать вопрос по гарантии",
      }}
    />
  );
}
