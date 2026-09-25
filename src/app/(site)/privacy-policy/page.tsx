import { DemoContentNotice } from "@/components/content/DemoContentNotice";
import { ServicePage } from "@/components/content/ServicePage";
import { ROUTES } from "@/constants/navigation";
import { getPublishedStubOverlay } from "@/lib/content/getPageContent";
import { createPageMetadata } from "@/lib/seo/metadata";

import styles from "./privacy.module.css";

const fallbackDescription =
  "Принципы обработки персональных данных при отправке заявок на сайтах BIZON Tires и BIZON Shop.";

export async function generateMetadata() {
  const page = await getPublishedStubOverlay("privacy-policy");
  return createPageMetadata({
    title: page?.seoTitle || "Политика конфиденциальности",
    description: page?.seoDescription || "Принципы обработки персональных данных при использовании сайта BIZON.",
    path: "/privacy-policy",
  });
}

const OPERATOR_NAME =
  process.env.NEXT_PUBLIC_LEGAL_OPERATOR_NAME?.trim() || "ООО «БИЗОН ТАЙРС»";
const OPERATOR_ADDRESS =
  process.env.NEXT_PUBLIC_LEGAL_OPERATOR_ADDRESS?.trim() ||
  "г. Москва, пример юридического адреса, 1";
const OPERATOR_CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "privacy@example.bizon.ru";

export default async function PrivacyPolicyPage() {
  const page = await getPublishedStubOverlay("privacy-policy");
  return (
    <ServicePage
      kicker={page?.hero.eyebrow || "Документы"}
      title={page?.hero.title || "Политика конфиденциальности"}
      description={page?.hero.lead || fallbackDescription}
      breadcrumbs={[
        { href: ROUTES.home, label: "Главная" },
        { href: ROUTES.privacyPolicy, label: "Политика конфиденциальности" },
      ]}
      notice={
        <DemoContentNotice>
          Перед production-запуском замените пример оператора, адрес и email на подтверждённые
          реквизиты, а текст — на версию, проверенную юристом.
        </DemoContentNotice>
      }
      featuresHeading="Кратко о обработке данных"
      features={[
        {
          title: "Оператор",
          text: `${OPERATOR_NAME}. Адрес: ${OPERATOR_ADDRESS}.`,
        },
        {
          title: "Какие данные обрабатываются",
          text: "Имя, телефон, email, сведения о компании, комментарий, состав заявки; технические метки источника обращения.",
        },
        {
          title: "Цели",
          text: "Обработка заявки, подбор решения, подготовка расчёта и связь с пользователем. Рекламные рассылки — только при отдельном согласии.",
        },
      ]}
    >
      <article className={styles.article}>
        <h2>Подробности политики</h2>
        <section>
          <h3>1. Оператор и область действия</h3>
          <p>
            Оператором персональных данных является {OPERATOR_NAME}. Политика применяется к данным,
            передаваемым через формы на сайтах BIZON Tires и BIZON Shop.
          </p>
          <p>Адрес оператора: {OPERATOR_ADDRESS}.</p>
        </section>
        <section>
          <h3>2. Передача и хранение</h3>
          <p>
            Данные хранятся в инфраструктуре проекта и могут передаваться уполномоченным
            обработчикам только в объёме, необходимом для работы сайта и обработки заявки: хостинг,
            почтовый сервис и Telegram после настройки.
          </p>
        </section>
        <section>
          <h3>3. Права пользователя</h3>
          <p>
            Пользователь может запросить уточнение, блокирование или удаление данных, а также
            отозвать согласие. Для обращения используйте email {OPERATOR_CONTACT_EMAIL} и укажите
            данные, позволяющие идентифицировать заявку.
          </p>
        </section>
      </article>
    </ServicePage>
  );
}
