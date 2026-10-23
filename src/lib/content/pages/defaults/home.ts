import { PREMIUM_MEDIA } from "@/constants/images";

import type { HomePageContent } from "../types";

export const HOME_PAGE_DEFAULTS: HomePageContent = {
  key: "home",
  seoTitle: undefined,
  seoDescription: undefined,
  hero: {
    eyebrow: "BIZON TIRES · PROFESSIONAL SERIES",
    title: "Шины для больших задач",
    lead: "Модель выбирается по технике, оси, нагрузке и маршруту — затем подтверждаем типоразмер, совместимость и наличие.",
    imageUrl: PREMIUM_MEDIA.hero,
    imageAlt: "Крупный план грузовой шины на тёмном фоне",
    primaryCta: { label: "Открыть каталог", href: "/models" },
    secondaryCta: { label: "Открыть модели и размеры", href: "/models" },
    metricLabel: "01",
    metricText: "От задачи автопарка — к проверяемой рекомендации",
  },
  directions: {
    eyebrow: "Популярные модели",
    title: "Ключевые модели шин",
    lead: "Проверенные решения для любых задач. Максимальный ресурс и стабильная эффективность в реальных условиях эксплуатации.",
  },
  expertise: {
    eyebrow: "Практика и опыт",
    title: "Инженерные решения для подбора и эксплуатации",
    lead: "Tire IQ, опыт эксплуатации и решения для корпоративных проектов.",
      imageUrl: PREMIUM_MEDIA.inspection,
      imageAlt: "Специалист измеряет глубину протектора грузовой шины",
      cta: { label: "Перейти к материалам", href: "/tire-iq" },
  },
  branding: {
    eyebrow: "",
    title: "Ваш бренд на шинах",
    lead: "Ваш бренд на шинах. Больше узнаваемости, сильнее присутствие, единый индустриальный стиль.",
    cta: { label: "Обсудить проект", href: "/contact?subject=branding" },
    beforeCaption: "Стандартный",
    afterCaption: "Брендированный",
    beforeImageUrl: PREMIUM_MEDIA.brandingTirePlain,
    beforeImageAlt: "Шина BIZON без брендирования",
    afterImageUrl: PREMIUM_MEDIA.brandingTireBranded,
    afterImageAlt: "Шина BIZON с брендированием",
  },
  shopCampaign: {
    eyebrow: "Вторая поверхность BIZON",
    title: "BIZON Shop",
    lead: "Кованые диски и предметы для тех, кто воспринимает технику как часть собственного характера.",
    imageUrl: PREMIUM_MEDIA.shopHero,
    imageAlt: "Кованый диск BIZON",
    cta: { label: "Выбрать модель и проверить совместимость", href: "/shop" },
  },
};
