import { PREMIUM_MEDIA } from "@/constants/images";

import type { HomePageContent } from "../types";

export const HOME_PAGE_DEFAULTS: HomePageContent = {
  key: "home",
  seoTitle: undefined,
  seoDescription: undefined,
  hero: {
    eyebrow: "BIZON TIRES · PROFESSIONAL SERIES",
    title: "Грузовые шины под условия работы вашего парка",
    lead: "Модель выбирается по технике, оси, нагрузке и маршруту — затем подтверждаем типоразмер, совместимость и наличие.",
    imageUrl: PREMIUM_MEDIA.hero,
    imageAlt: "Грузовик на горной магистрали на закате",
    primaryCta: { label: "Открыть каталог", href: "/models" },
    secondaryCta: { label: "Открыть модели и размеры", href: "/models" },
    metricLabel: "01",
    metricText: "От задачи автопарка — к проверяемой рекомендации",
  },
  selectionEntry: {
    eyebrow: "Начать с задачи",
    title: "Подобрать модель по технике и маршруту",
    lead: "Выберите тип техники — первый ответ уже будет сохранён в подборе.",
    imageUrl: "",
    imageAlt: "Грузовой автомобиль на дороге в горном ландшафте",
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
  },
  shopCampaign: {
    eyebrow: "Вторая поверхность BIZON",
    title: "BIZON Shop",
    lead: "Кованые диски и предметы для тех, кто воспринимает технику как часть собственного характера.",
    imageUrl: PREMIUM_MEDIA.shopHero,
    imageAlt: "Кованый диск BIZON",
    cta: { label: "Выбрать модель и проверить совместимость", href: "/shop" },
  },
  resume: {
    eyebrow: "Готовы начать?",
    title: "Готовы обсудить задачу",
    lead: "Опишите технику и условия — специалист BIZON проверит совместимость и наличие.",
    primaryCta: { label: "Связаться", href: "/contact" },
    secondaryCta: { label: "Связаться напрямую", href: "/contact" },
  },
};
