import { ServicePage } from "@/components/content/ServicePage";
import { PREMIUM_MEDIA } from "@/constants/images";
import { ROUTES } from "@/constants/navigation";
import { getPublishedStubOverlay } from "@/lib/content/getPageContent";
import { createPageMetadata } from "@/lib/seo/metadata";

const fallbackTitle = "О компании BIZON";
const fallbackDescription =
  "Помогаем автопаркам подобрать шины под технику, маршрут и нагрузку — и передать запрос специалистам без лишних обещаний.";

export async function generateMetadata() {
  const page = await getPublishedStubOverlay("about");
  return createPageMetadata({
    title: page?.seoTitle || "О компании",
    description: page?.seoDescription || fallbackDescription,
    path: ROUTES.about,
  });
}

export default async function AboutPage() {
  const page = await getPublishedStubOverlay("about");
  return (
    <ServicePage
      kicker={page?.hero.eyebrow || "BIZON · Heavy Duty"}
      title={page?.hero.title || fallbackTitle}
      description={page?.hero.lead || fallbackDescription}
      breadcrumbs={[
        { href: ROUTES.home, label: "Главная" },
        { href: ROUTES.about, label: "О компании" },
      ]}
      media={{
        src: page?.hero.imageUrl || PREMIUM_MEDIA.highwayCategory,
        alt: page?.hero.imageAlt || "Коммерческий автопарк на маршруте",
      }}
      featuresHeading="Как мы работаем"
      features={[
        {
          title: "Подбор по задаче",
          text: "Каталог TBR и OTR строится вокруг техники и условий эксплуатации — без имитации фильтров, которых ещё нет в данных.",
        },
        {
          title: "B2B-коммуникация",
          text: "Заявка передаёт менеджеру контакты и контекст задачи. Условия поставки и наличие типоразмера подтверждаются индивидуально.",
        },
        {
          title: "Проверенный ассортимент",
          text: "На сайте публикуются только направления и модели с готовыми страницами. Пустые витрины и демонстрационные остатки не показываем.",
        },
      ]}
      proof={{
        src: PREMIUM_MEDIA.consultation,
        alt: "Консультация по подбору шин для автопарка",
        title: "От задачи парка — к проверяемой рекомендации",
        text: "Предварительный подбор помогает сузить направление. Финальную совместимость и наличие подтверждает специалист BIZON.",
      }}
      cta={{
        href: ROUTES.selectionEntry,
        label: "Подобрать шины",
        secondaryHref: ROUTES.contact,
        secondaryLabel: "Связаться напрямую",
      }}
    />
  );
}
