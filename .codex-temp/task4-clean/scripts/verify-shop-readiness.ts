import { SHOP_LIFESTYLE_CATEGORIES } from "../src/constants/shopCategories";
import { SHOP_WHEEL_DESIGNS } from "../src/constants/shopWheels";
import { getPayload } from "../src/lib/payload/getPayload";
import type { Product, ShopCategory, WheelModel, WheelType } from "../src/payload-types";

type Severity = "blocker" | "warning";

type Finding = {
  severity: Severity;
  code: string;
  item: string;
  message: string;
};

function relationId(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "id" in value && typeof value.id === "number") {
    return value.id;
  }
  return null;
}

function relationSlug(value: unknown): string | null {
  if (value && typeof value === "object" && "slug" in value && typeof value.slug === "string") {
    return value.slug;
  }
  return null;
}

function hasUpload(value: unknown): boolean {
  return typeof value === "number" || Boolean(value && typeof value === "object" && "id" in value);
}

function normalizedOption(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

console.log("verify-shop-readiness: start");

const payload = await getPayload();
const [categoryResult, productResult, wheelTypeResult, wheelModelResult] = await Promise.all([
  payload.find({ collection: "shop-categories", limit: 500, depth: 1, overrideAccess: true }),
  payload.find({ collection: "products", limit: 500, depth: 1, overrideAccess: true }),
  payload.find({ collection: "wheel-types", limit: 500, depth: 1, overrideAccess: true }),
  payload.find({ collection: "wheel-models", limit: 500, depth: 1, overrideAccess: true }),
]);

const categories = categoryResult.docs as ShopCategory[];
const products = productResult.docs as Product[];
const wheelTypes = wheelTypeResult.docs as WheelType[];
const wheelModels = wheelModelResult.docs as WheelModel[];
const findings: Finding[] = [];

const categoriesById = new Map(categories.map((category) => [category.id, category]));
const publishedCategories = categories.filter((category) => category.status === "published");
const publishedProducts = products.filter((product) => product.status === "published");
const forgedType = wheelTypes.find(
  (type) => type.slug === "forged" && type.status === "published",
);

for (const requiredCategory of SHOP_LIFESTYLE_CATEGORIES) {
  const category = publishedCategories.find((item) => item.slug === requiredCategory.slug);
  if (!category) {
    findings.push({
      severity: "blocker",
      code: "CATEGORY_NOT_PUBLISHED",
      item: requiredCategory.slug,
      message: "Обязательная категория отсутствует или не опубликована.",
    });
    continue;
  }

  if (!category.description?.trim()) {
    findings.push({
      severity: "warning",
      code: "CATEGORY_DESCRIPTION_MISSING",
      item: category.slug,
      message: "В CMS не заполнено описание категории.",
    });
  }
  if (!hasUpload(category.coverImage)) {
    findings.push({
      severity: "warning",
      code: "CATEGORY_COVER_MISSING",
      item: category.slug,
      message: "В CMS нет обложки; публичная страница пока использует утверждённый статический арт.",
    });
  }
}

for (const product of publishedProducts) {
  const categoryId = relationId(product.shopCategory);
  const category = categoryId ? categoriesById.get(categoryId) : undefined;
  const item = product.slug || String(product.id);

  if (!category || category.status !== "published") {
    findings.push({
      severity: "blocker",
      code: "PRODUCT_CATEGORY_INVALID",
      item,
      message: "Товар связан с отсутствующей или неопубликованной категорией.",
    });
  }
  if (!product.shortDescription?.trim()) {
    findings.push({
      severity: "blocker",
      code: "PRODUCT_DESCRIPTION_MISSING",
      item,
      message: "Для опубликованного товара требуется краткое описание.",
    });
  }
  if (!hasUpload(product.mainImage)) {
    findings.push({
      severity: "blocker",
      code: "PRODUCT_IMAGE_MISSING",
      item,
      message: "Для опубликованного товара требуется основное изображение.",
    });
  }
  if (!product.priceOnRequest && product.price == null) {
    findings.push({
      severity: "blocker",
      code: "PRODUCT_PRICE_MISSING",
      item,
      message: "Укажите цену либо включите режим «Цена по запросу».",
    });
  }
  if (product.oldPrice != null && product.price != null && product.oldPrice <= product.price) {
    findings.push({
      severity: "blocker",
      code: "PRODUCT_OLD_PRICE_INVALID",
      item,
      message: "Старая цена должна быть больше текущей.",
    });
  }

  const combinations = new Set<string>();
  const skus = new Set<string>();
  for (const [index, variant] of (product.variants ?? []).entries()) {
    const variantItem = `${item}#${index + 1}`;
    const combination = [variant.color, variant.size, variant.configuration]
      .map(normalizedOption)
      .join("|");
    const sku = normalizedOption(variant.sku);

    if (combination === "||") {
      findings.push({
        severity: "blocker",
        code: "VARIANT_OPTIONS_MISSING",
        item: variantItem,
        message: "Вариант должен отличаться цветом, размером или комплектацией.",
      });
    } else if (combinations.has(combination)) {
      findings.push({
        severity: "blocker",
        code: "VARIANT_DUPLICATE",
        item: variantItem,
        message: "Комбинация варианта дублируется внутри товара.",
      });
    }
    combinations.add(combination);

    if (sku && skus.has(sku)) {
      findings.push({
        severity: "blocker",
        code: "VARIANT_SKU_DUPLICATE",
        item: variantItem,
        message: "Артикул варианта дублируется внутри товара.",
      });
    }
    if (sku) skus.add(sku);

    if (!variant.priceOnRequest && variant.price == null) {
      findings.push({
        severity: "blocker",
        code: "VARIANT_PRICE_MISSING",
        item: variantItem,
        message: "Укажите цену варианта либо включите режим «Цена по запросу».",
      });
    }
    if (variant.oldPrice != null && variant.price != null && variant.oldPrice <= variant.price) {
      findings.push({
        severity: "blocker",
        code: "VARIANT_OLD_PRICE_INVALID",
        item: variantItem,
        message: "Старая цена варианта должна быть больше текущей.",
      });
    }
  }
}

if (!forgedType) {
  findings.push({
    severity: "blocker",
    code: "FORGED_TYPE_NOT_PUBLISHED",
    item: "forged",
    message: "Тип кованых дисков отсутствует или не опубликован.",
  });
} else {
  const forgedModels = wheelModels.filter(
    (model) => model.status === "published" &&
      (relationId(model.wheelType) === forgedType.id || relationSlug(model.wheelType) === forgedType.slug),
  );

  for (const design of SHOP_WHEEL_DESIGNS) {
    const model = forgedModels.find((item) => item.slug === design.slug);
    if (!model) {
      findings.push({
        severity: "blocker",
        code: "FORGED_MODEL_NOT_IN_CMS",
        item: design.slug,
        message: "Утверждённый дизайн пока существует только в статическом слое и не перенесён в CMS.",
      });
      continue;
    }
    if (!hasUpload(model.mainImage)) {
      findings.push({
        severity: "blocker",
        code: "FORGED_MODEL_IMAGE_MISSING",
        item: design.slug,
        message: "Для опубликованной CMS-модели требуется mainImage в Media.",
      });
    }
    if ((model.gallery ?? []).filter(hasUpload).length < 3) {
      findings.push({
        severity: "blocker",
        code: "FORGED_MODEL_GALLERY_MISSING",
        item: design.slug,
        message: "Для опубликованной CMS-модели требуется галерея минимум из 3 изображений в Media.",
      });
    }
  }
}

const blockers = findings.filter((finding) => finding.severity === "blocker");
const warnings = findings.filter((finding) => finding.severity === "warning");

console.log(JSON.stringify({
  ok: blockers.length === 0,
  counts: {
    categories: categories.length,
    publishedCategories: publishedCategories.length,
    products: products.length,
    publishedProducts: publishedProducts.length,
    wheelModels: wheelModels.length,
  },
  blockers,
  warnings,
}, null, 2));

if (blockers.length > 0) {
  console.error(`verify-shop-readiness: blocked (${blockers.length} blocker(s), ${warnings.length} warning(s))`);
  process.exit(1);
}

console.log(`verify-shop-readiness: ready (${warnings.length} warning(s))`);
process.exit(0);
