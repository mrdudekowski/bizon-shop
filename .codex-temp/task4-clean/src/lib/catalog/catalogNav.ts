import {
  ADMIN_GROUPS,
  TIRE_APPLICATION_CATEGORIES,
  WHEEL_CONSTRUCTION_METHODS,
} from "@/collections/fields/constants";

export type CatalogAxisId = "tires" | "wheels" | "shop";

export type DashboardSectionId = CatalogAxisId | "content";

export type CatalogRelationTo = "products" | "tire-models" | "wheel-models";

export type CatalogDashboardAction = {
  label: string;
  collection: string;
  create?: boolean;
};

export type CatalogDashboardSection = {
  id: DashboardSectionId;
  title: string;
  description: string;
  items: CatalogDashboardAction[];
};

type SelectFilterStep = {
  type: "select";
  id: string;
  label: string;
  filterField: string;
  options: readonly { label: string; value: string }[];
};

export type CollectionFilterStep = {
  type: "collection";
  id: string;
  label: string;
  filterField: string;
  collection: string;
};

export type CatalogFilterStep = SelectFilterStep | CollectionFilterStep;

export type CatalogAxis = {
  id: CatalogAxisId;
  label: string;
  adminGroup: (typeof ADMIN_GROUPS)[keyof typeof ADMIN_GROUPS];
  relationTo: CatalogRelationTo;
  storageSegment: string;
  targetLabel: string;
  description: string;
  steps: CatalogFilterStep[];
  dashboardItems: CatalogDashboardAction[];
};

/** S3 path segment for polymorphic catalog relations on Media */
export const CATALOG_RELATION_STORAGE = {
  products: "shop",
  "tire-models": "tires",
  "wheel-models": "wheels",
} as const satisfies Record<CatalogRelationTo, string>;

export const CATALOG_AXES: CatalogAxis[] = [
  {
    id: "tires",
    label: "Шины",
    adminGroup: ADMIN_GROUPS.tireCatalog,
    relationTo: "tire-models",
    storageSegment: CATALOG_RELATION_STORAGE["tire-models"],
    targetLabel: "Модель шины",
    description: "Типы шин, модели, размеры и характеристики.",
    steps: [
      {
        type: "collection",
        id: "tireType",
        label: "Тип шин",
        filterField: "tireType",
        collection: "tire-types",
      },
      {
        type: "select",
        id: "applicationCategory",
        label: "Сегмент",
        filterField: "applicationCategory",
        options: TIRE_APPLICATION_CATEGORIES,
      },
    ],
    dashboardItems: [
      { label: "Типы шин", collection: "tire-types" },
      { label: "Модели шин", collection: "tire-models" },
      { label: "Размеры / варианты шин", collection: "tire-variants" },
    ],
  },
  {
    id: "wheels",
    label: "Диски",
    adminGroup: ADMIN_GROUPS.wheelCatalog,
    relationTo: "wheel-models",
    storageSegment: CATALOG_RELATION_STORAGE["wheel-models"],
    targetLabel: "Модель диска",
    description: "Типы дисков, модели и размеры.",
    steps: [
      {
        type: "collection",
        id: "wheelType",
        label: "Тип дисков",
        filterField: "wheelType",
        collection: "wheel-types",
      },
      {
        type: "select",
        id: "constructionMethod",
        label: "Изготовление",
        filterField: "constructionMethod",
        options: WHEEL_CONSTRUCTION_METHODS,
      },
    ],
    dashboardItems: [
      { label: "Типы дисков", collection: "wheel-types" },
      { label: "Модели дисков", collection: "wheel-models" },
      { label: "Размеры / варианты дисков", collection: "wheel-variants" },
    ],
  },
  {
    id: "shop",
    label: "Bison.Shop",
    adminGroup: ADMIN_GROUPS.catalog,
    relationTo: "products",
    storageSegment: CATALOG_RELATION_STORAGE.products,
    targetLabel: "Товар магазина",
    description: "Категории и товары магазина.",
    steps: [
      {
        type: "collection",
        id: "shopCategory",
        label: "Категория",
        filterField: "shopCategory",
        collection: "shop-categories",
      },
    ],
    dashboardItems: [
      { label: "Категории магазина", collection: "shop-categories" },
      { label: "Товары магазина", collection: "products" },
      { label: "Заявки", collection: "requests" },
    ],
  },
];

export const contentDashboardSection: CatalogDashboardSection = {
  id: "content",
  title: "Контент",
  description: "Статьи Tire IQ и истории клиентов People Stories.",
  items: [
    { label: "Tire IQ", collection: "tire-iq-articles" },
    { label: "People Stories", collection: "people-stories" },
  ],
};

export const catalogDashboardSections: CatalogDashboardSection[] = [
  ...CATALOG_AXES.map((axis) => ({
    id: axis.id,
    title: axis.label,
    description: axis.description,
    items: axis.dashboardItems,
  })),
  contentDashboardSection,
];

export function getAxisById(axisId: CatalogAxisId | null): CatalogAxis | undefined {
  return axisId ? CATALOG_AXES.find((axis) => axis.id === axisId) : undefined;
}

export function getAxisByRelationTo(relationTo: string): CatalogAxis | undefined {
  return CATALOG_AXES.find((axis) => axis.relationTo === relationTo);
}

export function isCatalogRelationTo(value: string): value is CatalogRelationTo {
  return Object.hasOwn(CATALOG_RELATION_STORAGE, value);
}

export function getCatalogStorageSegment(collection: string): string | undefined {
  return isCatalogRelationTo(collection) ? CATALOG_RELATION_STORAGE[collection] : undefined;
}

/** ponytail: runnable self-check — fails if nav config drifts from storage map */
export function catalogNavSelfCheck(): void {
  for (const axis of CATALOG_AXES) {
    if (CATALOG_RELATION_STORAGE[axis.relationTo] !== axis.storageSegment) {
      throw new Error(`catalogNav: storageSegment mismatch for ${axis.id}`);
    }
    if (catalogDashboardSections.length !== CATALOG_AXES.length + 1) {
      throw new Error("catalogNav: dashboard sections out of sync");
    }
  }
}

if (process.env.NODE_ENV !== "production") {
  catalogNavSelfCheck();
}
