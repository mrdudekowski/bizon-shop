import { PAGE_LABELS } from "@/admin/pages/pageLabels";
import type { FieldLocation, PageKey, StatusEntity } from "./types";

type CatalogNode = {
  tab?: string;
  field?: string;
  itemLabelKey?: string;
  children?: Record<string, CatalogNode>;
};

const IMAGE_CHILDREN: Record<string, CatalogNode> = {
  assetId: { field: "Файл" },
  alt: { field: "Подпись" },
  focalX: { field: "Фокус X" },
  focalY: { field: "Фокус Y" },
  crop: {
    field: "Кадр",
    children: {
      x: { field: "Кадр X" },
      y: { field: "Кадр Y" },
      width: { field: "Кадр, ширина" },
      height: { field: "Кадр, высота" },
    },
  },
};

const SECTION_COPY: Record<string, CatalogNode> = {
  eyebrow: { field: "Надзаголовок" },
  title: { field: "Заголовок" },
  lead: { field: "Лид" },
};

const CTA: Record<string, CatalogNode> = {
  label: { field: "Текст кнопки" },
  href: { field: "Ссылка кнопки" },
};

const DOCUMENT: Record<string, CatalogNode> = {
  assetId: { field: "Файл документа" },
  title: { field: "Название документа" },
};

const SIZE_FIELDS: Record<string, CatalogNode> = {
  size: { field: "Размер" },
  price: { field: "Цена" },
  priceOnRequest: { field: "Цена по запросу" },
  available: { field: "В наличии" },
  sku: { field: "Артикул" },
  rimDiameter: { field: "Диаметр обода" },
  loadIndex: { field: "Индекс нагрузки" },
  loadIndexDual: { field: "Индекс нагрузки dual" },
  speedIndex: { field: "Индекс скорости" },
  plyRating: { field: "Слойность" },
  overallDiameter: { field: "Внешний диаметр" },
  sectionWidth: { field: "Ширина профиля" },
  treadDepth: { field: "Глубина протектора" },
  pressureSingleKpa: { field: "Давление single, кПа" },
  pressureDualKpa: { field: "Давление dual, кПа" },
  maxLoadSingleKg: { field: "Нагрузка single, кг" },
  maxLoadDualKg: { field: "Нагрузка dual, кг" },
  recommendedRim: { field: "Рекомендуемый обод" },
};

const CATALOGS: Record<StatusEntity, { section: string; root: Record<string, CatalogNode> }> = {
  "tire-model": {
    section: "Шины",
    root: {
      name: { tab: "Карточка", field: "Название" },
      slug: { tab: "Карточка", field: "Адрес" },
      modelCode: { tab: "Карточка", field: "Код модели" },
      directionId: { tab: "Карточка", field: "Направление" },
      brand: { tab: "Карточка", field: "Бренд" },
      descriptionShort: { tab: "Карточка", field: "Короткое описание" },
      descriptionLong: { tab: "Карточка", field: "Полное описание" },
      treadType: { tab: "Карточка", field: "Тип протектора" },
      applicationCategory: { tab: "Карточка", field: "Категория применения" },
      applicationTypes: { tab: "Карточка", field: "Применение шины" },
      documents: { tab: "Карточка", children: DOCUMENT },
      selectionVehicleTypes: { tab: "Карточка", field: "Техника" },
      selectionConditions: { tab: "Карточка", field: "Условия" },
      selectionAxles: { tab: "Карточка", field: "Оси" },
      sizes: { tab: "Размеры", itemLabelKey: "size", children: SIZE_FIELDS },
      mainImage: { tab: "Фото", field: "Главное фото", children: IMAGE_CHILDREN },
      gallery: { tab: "Фото", field: "Фото галереи", children: IMAGE_CHILDREN },
      advantages: {
        tab: "Преимущества",
        itemLabelKey: "title",
        children: { title: { field: "Заголовок" }, description: { field: "Текст" } },
      },
      features: {
        tab: "Преимущества",
        itemLabelKey: "title",
        children: { key: { field: "Ключ" }, title: { field: "Заголовок" }, description: { field: "Текст" } },
      },
      showInMenu: { tab: "Меню", field: "Показывать в меню" },
      menuOrder: { tab: "Меню", field: "Порядок в меню" },
    },
  },
  "tire-direction": {
    section: "Шины",
    root: {
      name: { tab: "Карточка", field: "Название" },
      slug: { tab: "Карточка", field: "Адрес" },
      description: { tab: "Карточка", field: "Описание" },
      shortDescription: { tab: "Карточка", field: "Короткое описание" },
      sortOrder: { tab: "Карточка", field: "Порядок" },
      showInMenu: { tab: "Карточка", field: "Показывать в меню" },
      selectionVehicleTypes: { tab: "Карточка", field: "Техника" },
      selectionConditions: { tab: "Карточка", field: "Условия" },
      mainImage: { tab: "Фото", field: "Главное фото", children: IMAGE_CHILDREN },
    },
  },
  "wheel-type": {
    section: "Диски",
    root: {
      name: { tab: "Карточка", field: "Название" },
      slug: { tab: "Карточка", field: "Адрес" },
      description: { tab: "Карточка", field: "Описание" },
      sortOrder: { tab: "Карточка", field: "Порядок" },
      showInMenu: { tab: "Карточка", field: "Показывать в меню" },
      mainImage: { tab: "Фото", field: "Главное фото", children: IMAGE_CHILDREN },
    },
  },
  "wheel-model": {
    section: "Диски",
    root: {
      name: { tab: "Карточка", field: "Название" },
      slug: { tab: "Карточка", field: "Адрес" },
      wheelTypeId: { tab: "Карточка", field: "Тип диска" },
      series: { tab: "Карточка", field: "Серия" },
      designStyle: { tab: "Карточка", field: "Стиль" },
      material: { tab: "Карточка", field: "Материал" },
      constructionMethod: { tab: "Карточка", field: "Конструкция" },
      fitmentNotes: { tab: "Карточка", field: "Посадка" },
      descriptionShort: { tab: "Карточка", field: "Короткое описание" },
      descriptionLong: { tab: "Карточка", field: "Полное описание" },
      showInMenu: { tab: "Карточка", field: "Показывать в меню" },
      menuOrder: { tab: "Карточка", field: "Порядок в меню" },
      documents: { tab: "Карточка", children: DOCUMENT },
      variants: {
        tab: "Варианты",
        itemLabelKey: "sizeLabel",
        children: {
          sizeLabel: { field: "Размер" },
          pcd: { field: "PCD" },
          offsetET: { field: "Вылет ET" },
          centerBore: { field: "Центральное отверстие" },
          color: { field: "Цвет" },
          price: { field: "Цена" },
          priceOnRequest: { field: "Цена по запросу" },
          available: { field: "В наличии" },
        },
      },
      mainImage: { tab: "Фото", field: "Главное фото", children: IMAGE_CHILDREN },
      gallery: { tab: "Фото", field: "Фото галереи", children: IMAGE_CHILDREN },
    },
  },
  "shop-category": {
    section: "Shop",
    root: {
      name: { tab: "Карточка категории", field: "Название" },
      slug: { tab: "Карточка категории", field: "Адрес" },
      description: { tab: "Карточка категории", field: "Описание" },
      sortOrder: { tab: "Карточка категории", field: "Порядок" },
      showInMenu: { tab: "Карточка категории", field: "Показывать в меню" },
      mainImage: { tab: "Фото", field: "Главное фото", children: IMAGE_CHILDREN },
    },
  },
  "shop-product": {
    section: "Shop",
    root: {
      name: { tab: "Карточка", field: "Название" },
      slug: { tab: "Карточка", field: "Адрес" },
      categoryId: { tab: "Карточка", field: "Категория" },
      subcategoryId: { tab: "Карточка", field: "Подкатегория" },
      descriptionShort: { tab: "Карточка", field: "Короткое описание" },
      descriptionLong: { tab: "Карточка", field: "Полное описание" },
      price: { tab: "Карточка", field: "Цена" },
      priceOnRequest: { tab: "Карточка", field: "Цена по запросу" },
      variants: {
        tab: "Варианты",
        itemLabelKey: "size",
        children: {
          color: { field: "Цвет" },
          size: { field: "Размер" },
          sku: { field: "SKU" },
          price: { field: "Цена" },
          priceOnRequest: { field: "Цена по запросу" },
          available: { field: "В наличии" },
          image: { field: "Фото варианта", children: IMAGE_CHILDREN },
        },
      },
      mainImage: { tab: "Фото", field: "Главное фото", children: IMAGE_CHILDREN },
      gallery: { tab: "Фото", field: "Фото галереи", children: IMAGE_CHILDREN },
    },
  },
  page: {
    section: "Страницы",
    root: {
      seoTitle: { tab: "Для поиска", field: "Заголовок страницы в поиске" },
      seoDescription: { tab: "Для поиска", field: "Описание страницы в поиске" },
      hero: { tab: "Шапка", children: { ...SECTION_COPY, image: { field: "Фон шапки", children: IMAGE_CHILDREN }, primaryCta: { field: "Основная кнопка", children: CTA }, secondaryCta: { field: "Вторая кнопка", children: CTA }, cta: { field: "Кнопка", children: CTA }, metricLabel: { field: "Подпись метрики" }, metricText: { field: "Текст метрики" } } },
      directions: { tab: "Направления", children: SECTION_COPY },
      expertise: { tab: "Экспертиза", children: SECTION_COPY },
      shopCampaign: {
        tab: "Кампания магазина",
        children: { ...SECTION_COPY, image: { field: "Картинка кампании", children: IMAGE_CHILDREN }, cta: { field: "Кнопка кампании", children: CTA } },
      },
      wheelsIntro: { tab: "Ввод дисков", children: { ...SECTION_COPY, kicker: { field: "Kicker" } } },
      orderSteps: {
        tab: "Шаги заказа",
        itemLabelKey: "title",
        children: { title: { field: "Заголовок" }, description: { field: "Текст" } },
      },
      categoryCarousel: {
        tab: "Карусель категорий",
        itemLabelKey: "title",
        children: {
          kicker: { field: "Надзаголовок" },
          title: { field: "Заголовок" },
          action: { field: "Действие" },
          href: { field: "Ссылка" },
          alt: { field: "Подпись" },
          desktopImage: { field: "Фото десктоп", children: IMAGE_CHILDREN },
          mobileImage: { field: "Фото мобильное", children: IMAGE_CHILDREN },
        },
      },
      vehicles: {
        tab: "Слайды техники",
        children: {
          ...SECTION_COPY,
          cta: { field: "Кнопка", children: CTA },
          slides: {
            itemLabelKey: "title",
            children: { title: { field: "Заголовок" }, alt: { field: "Подпись" }, image: { field: "Фото", children: IMAGE_CHILDREN } },
          },
        },
      },
      documents: { tab: "Документы", children: DOCUMENT },
    },
  },
  material: {
    section: "Материалы",
    root: {
      kind: { tab: "Карточка", field: "Тип" },
      title: { tab: "Карточка", field: "Заголовок" },
      slug: { tab: "Карточка", field: "Адрес" },
      excerpt: { tab: "Карточка", field: "Анонс" },
      body: { tab: "Карточка", field: "Текст" },
      clientName: { tab: "Карточка", field: "Клиент" },
      industry: { tab: "Карточка", field: "Отрасль" },
      showInMenu: { tab: "Карточка", field: "Показывать в меню" },
      menuOrder: { tab: "Карточка", field: "Порядок в меню" },
      image: { tab: "Фото", field: "Главное фото", children: IMAGE_CHILDREN },
      gallery: { tab: "Фото", field: "Фото галереи", children: IMAGE_CHILDREN },
    },
  },
};

export function parseFieldPath(path: string): (string | number)[] {
  const parts: (string | number)[] = [];
  for (const match of path.matchAll(/([^[.\]]+)|\[(\d+)\]/g)) {
    if (match[1]) parts.push(match[1]);
    else parts.push(Number(match[2]));
  }
  return parts;
}

function documentTitle(entityType: StatusEntity, draft: unknown): string {
  if (draft == null || typeof draft !== "object") return "Документ";
  const record = draft as { id?: string; name?: string; title?: string };
  if (entityType === "page" && typeof record.id === "string") {
    return PAGE_LABELS[record.id as PageKey] ?? record.id;
  }
  if (typeof record.name === "string" && record.name.trim()) return record.name;
  if (typeof record.title === "string" && record.title.trim()) return record.title;
  return "Документ";
}

function readPath(draft: unknown, parts: (string | number)[]): unknown {
  let current = draft;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[String(part)];
  }
  return current;
}

export function isCataloguedField(entityType: StatusEntity, path: string): boolean {
  const catalog = CATALOGS[entityType];
  if (catalog == null) return false;
  let node: CatalogNode | undefined = { children: catalog.root };
  for (const part of parseFieldPath(path)) {
    if (typeof part === "number") continue;
    node = node?.children?.[part];
    if (node == null) return false;
  }
  return node.field != null || node.children != null;
}

export function locateField(entityType: StatusEntity, path: string, draft: unknown): FieldLocation {
  const catalog = CATALOGS[entityType];
  const fallback: FieldLocation = {
    section: catalog?.section ?? "Каталог",
    document: documentTitle(entityType, draft),
    tab: "Карточка",
    field: path,
  };
  if (catalog == null) return fallback;

  let node: CatalogNode | undefined = { children: catalog.root };
  let tab = "Карточка";
  let field = path;
  let itemLabel: string | undefined;
  const parts = parseFieldPath(path);
  const walked: (string | number)[] = [];

  for (const part of parts) {
    walked.push(part);
    if (typeof part === "number") {
      const parent = readPath(draft, walked.slice(0, -1));
      const item = Array.isArray(parent) ? parent[part] : undefined;
      if (item != null && typeof item === "object" && node?.itemLabelKey) {
        const label = (item as Record<string, unknown>)[node.itemLabelKey];
        if (typeof label === "string" && label.trim()) itemLabel = label;
      }
      continue;
    }
    node = node?.children?.[part];
    if (node == null) return fallback;
    if (node.tab) tab = node.tab;
    if (node.field) field = node.field;
  }

  return {
    section: catalog.section,
    document: documentTitle(entityType, draft),
    tab,
    field,
    itemLabel,
  };
}
