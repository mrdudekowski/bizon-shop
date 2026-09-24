import { ROUTES } from "@/constants/navigation";
import { curateMenuItems } from "./curateMenuItems";
import type { DualPaneSection } from "./dualPaneMenuTypes";
import type { CmsArticle, CmsShopCategory, CmsTireModel, CmsTireType, CmsWheelModel } from "./types";

function tireModelPills(model: CmsTireModel): string[] {
  const pills: string[] = [];
  if (model.tireTypeName) pills.push(model.tireTypeName);
  const firstFeature = model.advantages[0]?.title?.trim();
  if (firstFeature) pills.push(firstFeature);
  return pills.slice(0, 2);
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
  tireTypes: CmsTireType[];
  articles: CmsArticle[];
}): DualPaneSection[] {
  const models = curateMenuItems(input.models).map((model) => ({
    id: model.id,
    title: model.name,
    href: `${ROUTES.models}/${model.tireTypeSlug}/${model.slug}`,
    imageUrl: model.imageUrl,
    pills: tireModelPills(model),
  }));

  const tireTypes = input.tireTypes
    .filter((type) => type.showInMenu)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((type) => ({
      id: type.slug,
      title: type.name,
      href: `${ROUTES.models}/${type.slug}`,
      imageUrl: type.imageUrl,
      pills: type.shortDescription ? [type.shortDescription] : undefined,
      description: type.shortDescription,
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
      id: "tire-types",
      label: "Типы шин",
      pane: "gallery",
      items: tireTypes,
      footerLink: { label: "Весь каталог", href: ROUTES.models },
    },
    {
      id: "shop",
      label: "Bizon Shop",
      pane: "list",
      items: [
        { id: "shop-home", title: "Магазин BIZON", href: ROUTES.shop, description: "Диски и аксессуары" },
        { id: "shop-wheels", title: "Кованые диски", href: `${ROUTES.shop}/wheels/forged` },
        { id: "shop-categories", title: "Все категории", href: ROUTES.shopCategories },
        { id: "shop-accessories", title: "Аксессуары", href: `${ROUTES.shop}/accessories` },
        { id: "shop-outdoor", title: "Outdoor", href: `${ROUTES.shop}/outdoor` },
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
        { id: "stories", title: "Истории клиентов", href: ROUTES.peopleStories },
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
