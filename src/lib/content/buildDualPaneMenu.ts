import { ROUTES } from "@/constants/navigation";
import { HERO_TIRE_CUTOUT_BY_SLUG } from "@/lib/catalog/heroTireSlides";
import { getModelHref } from "@/lib/catalog/tireReadModel";
import { curateMenuItems } from "./curateMenuItems";
import type { DualPaneSection } from "./dualPaneMenuTypes";
import type { CmsArticle, CmsShopCategory, CmsTireModel, CmsWheelModel } from "./types";

function tireModelPills(model: CmsTireModel): string[] {
  return model.tireTypeName ? [model.tireTypeName] : [];
}

function wheelModelPills(model: CmsWheelModel): string[] {
  const pills: string[] = [];
  if (model.wheelTypeName) pills.push(model.wheelTypeName);
  const second = model.constructionMethod || model.material || model.series;
  if (second) pills.push(second);
  return pills.slice(0, 2);
}

export function buildMainDualPaneMenuSections(input: {
  models: CmsTireModel[];
  articles: CmsArticle[];
  categories: CmsShopCategory[];
}): DualPaneSection[] {
  const models = [...input.models]
    .sort((a, b) => (a.menuOrder ?? 0) - (b.menuOrder ?? 0))
    .map((model) => ({
      id: model.id,
      title: model.name,
      href: getModelHref(model),
      imageUrl: HERO_TIRE_CUTOUT_BY_SLUG[model.slug] ?? model.imageUrl,
      pills: tireModelPills(model),
      advantages: model.advantages,
    }));

  const articles = curateMenuItems(input.articles).map((article) => ({
    id: article.slug,
    title: article.title,
    href: `${ROUTES.tireIq}/${article.slug}`,
    imageUrl: article.imageUrl,
    description: article.excerpt,
  }));

  return [
    {
      id: "models",
      label: "Модели",
      pane: "gallery",
      items: models,
      footerLink: { label: "Все модели", href: ROUTES.models },
    },
    {
      id: "shop",
      label: "Bizon Shop",
      pane: "list",
      items: [
        { id: "shop-home", title: "Магазин BIZON", href: ROUTES.shop, description: "Диски и аксессуары" },
        { id: "shop-wheels", title: "Кованые диски", href: `${ROUTES.shop}/wheels/forged` },
        { id: "shop-categories", title: "Все категории", href: ROUTES.shopCategories },
        ...input.categories
          .filter((category) => category.showInMenu)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((category) => ({
            id: category.slug,
            title: category.name,
            href: `${ROUTES.shop}/${category.slug}`,
            imageUrl: category.imageUrl,
            description: category.description,
          })),
        { id: "shop-delivery", title: "Доставка и возврат", href: ROUTES.shopDeliveryAndReturns },
      ],
    },
    {
      id: "branding",
      label: "Индивидуальное брендирование",
      pane: "list",
      items: [
        { id: "branding-page", title: "О брендировании", href: ROUTES.branding },
        {
          id: "branding-contact",
          title: "Обсудить проект",
          href: `${ROUTES.contact}?subject=branding`,
          description: "Заявка на индивидуальное брендирование",
        },
      ],
    },
    {
      id: "tire-iq",
      label: "Tire IQ",
      pane: "list",
      items: articles,
      footerLink: { label: "Все материалы", href: ROUTES.tireIq },
    },
    {
      id: "about",
      label: "О компании",
      pane: "list",
      items: [
        { id: "about-page", title: "О компании", href: ROUTES.about },
        { id: "contact", title: "Контакты", href: ROUTES.contact },
        { id: "warranty", title: "Гарантия", href: ROUTES.warranty },
        { id: "supplier", title: "Стать поставщиком", href: ROUTES.supplier },
      ],
    },
  ];
}

export function buildShopDualPaneMenuSections(input: {
  wheels: CmsWheelModel[];
  categories: CmsShopCategory[];
}): DualPaneSection[] {
  const wheels = curateMenuItems(input.wheels).map((model) => ({
    id: model.id,
    title: model.name,
    href: `${ROUTES.shop}/wheels/${model.wheelTypeSlug}/${model.slug}`,
    imageUrl: model.imageUrl,
    pills: wheelModelPills(model),
  }));

  const categories = input.categories
    .filter((category) => category.showInMenu)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((category) => ({
      id: category.slug,
      title: category.name,
      href: `${ROUTES.shop}/${category.slug}`,
      imageUrl: category.imageUrl,
      description: category.description,
    }));

  return [
    {
      id: "wheels",
      label: "Диски",
      pane: "gallery",
      items: wheels,
      footerLink: { label: "Все диски", href: `${ROUTES.shop}/wheels/forged` },
    },
    {
      id: "categories",
      label: "Категории",
      pane: "list",
      items: [
        { id: "all-categories", title: "Все категории", href: ROUTES.shopCategories },
        ...categories,
      ],
    },
    {
      id: "buyers",
      label: "Покупателям",
      pane: "list",
      items: [
        { id: "delivery", title: "Доставка и возврат", href: ROUTES.shopDeliveryAndReturns },
        { id: "contact", title: "Связаться с BIZON", href: ROUTES.contact },
      ],
    },
    {
      id: "bizon-tires",
      label: "BIZON Tires",
      pane: "list",
      items: [
        { id: "tires", title: "Шины для коммерческого транспорта", href: ROUTES.models },
        { id: "home", title: "Вернуться на основной сайт", href: ROUTES.home },
      ],
    },
  ];
}
