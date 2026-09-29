import { getPublishedStubOverlay } from "@/lib/content/getPageContent";
import { createPageMetadata } from "@/lib/seo/metadata";
import { PageHeader } from "@/components/catalog/PageHeader";
import { DemoContentNotice } from "@/components/content/DemoContentNotice";

const FALLBACK_TITLE = "Доставка и возврат";
const FALLBACK_LEAD =
  "Shop принимает заявку. Стоимость доставки, срок и условия возврата подтверждает менеджер до сделки.";

export async function generateMetadata() {
  const page = await getPublishedStubOverlay("shop-delivery-returns");
  return createPageMetadata({
    title: page?.seoTitle || FALLBACK_TITLE,
    description: page?.seoDescription || FALLBACK_LEAD,
    path: "/shop/delivery-and-returns",
  });
}

export default async function DeliveryAndReturnsPage() {
  const page = await getPublishedStubOverlay("shop-delivery-returns");
  return (
    <div className="section-inner">
      <PageHeader
        title={page?.hero.title || FALLBACK_TITLE}
        description={page?.hero.lead || FALLBACK_LEAD}
        breadcrumbs={[
          { href: "/shop", label: "BIZON Shop" },
          { href: "/shop/delivery-and-returns", label: "Доставка и возврат" },
        ]}
      />
      <DemoContentNotice>Примеры ниже описывают желаемый UX: Shop принимает заявку, а не онлайн-оплату. Финальные условия необходимо заменить до запуска продаж.</DemoContentNotice>
      <div className="grid gap-5 max-w-3xl">
        <section className="card-base info-card"><h2 className="info-card-title">Оформление заявки</h2><p className="info-card-text mt-3">Добавьте позиции в корзину и оставьте контакты. В демонстрационном сценарии менеджер в течение одного рабочего дня уточняет наличие, цену, способ и срок поставки до оформления сделки.</p></section>
        <section className="card-base info-card"><h2 className="info-card-title">Доставка</h2><p className="info-card-text mt-3">Пример: доставка доступна по России транспортной компанией или самовывозом по согласованию. Стоимость и дата зависят от габаритов заказа, региона и выбранного перевозчика и фиксируются в предложении менеджера.</p></section>
        <section className="card-base info-card"><h2 className="info-card-title">Возврат и обмен</h2><p className="info-card-text mt-3">Пример: до использования товара покупатель направляет заявку менеджеру с номером заказа и фотографиями товара. Возможность возврата, адрес и расходы на перевозку подтверждаются индивидуально после проверки основания обращения.</p></section>
      </div>
    </div>
  );
}
