import { PREMIUM_MEDIA } from "@/constants/images";

import type { HomePageContent } from "../types";

export const HOME_PAGE_DEFAULTS: HomePageContent = {
  key: "home",
  seoTitle: undefined,
  seoDescription: undefined,
  hero: {
    eyebrow: "BIZON TIRES · PROFESSIONAL SERIES",
    title: "Грузовые шины под условия работы вашего парка",
    lead: "Подберём модель по технике, оси, нагрузке и маршруту — затем подтвердим типоразмер, совместимость и наличие.",
    imageUrl: PREMIUM_MEDIA.hero,
    imageAlt: "Грузовой автопарк на магистрали",
    primaryCta: { label: "Начать подбор", href: "/#solutions" },
    secondaryCta: { label: "Открыть модели и размеры", href: "/models" },
    metricLabel: "01",
    metricText: "От задачи автопарка — к проверяемой рекомендации",
  },
  selectionEntry: {
    eyebrow: "Начать с задачи",
    title: "Подобрать модель по технике и маршруту",
    lead: "Выберите тип техники — первый ответ уже будет сохранён в подборе.",
  },
  directions: {
    eyebrow: "BIZON TIRES",
    title: "Выберите условия эксплуатации",
    lead: "Посмотрите модели по сценарию работы, затем подтвердим типоразмер и наличие под вашу задачу.",
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
    title: "Три ответа до предварительной рекомендации",
    lead: "Подбор не заменяет инженерную проверку — он помогает передать специалисту уже структурированную задачу.",
    primaryCta: { label: "Подобрать шины", href: "/#solutions" },
    secondaryCta: { label: "Связаться напрямую", href: "/contact" },
  },
};
