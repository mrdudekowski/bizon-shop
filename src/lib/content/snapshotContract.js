function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringFields(value, fields, path) {
  for (const field of fields) {
    if (typeof value[field] !== "string") return `${path}.${field}`;
  }
  return null;
}

function recordArray(value, path, requiredStrings = []) {
  if (!Array.isArray(value)) return path;
  for (const [index, item] of value.entries()) {
    const itemPath = `${path}[${index}]`;
    if (!isRecord(item)) return itemPath;
    const issue = stringFields(item, requiredStrings, itemPath);
    if (issue) return issue;
  }
  return null;
}

function optionalRecordArray(value, key, path, requiredStrings) {
  return value[key] === undefined || value[key] === null
    ? null
    : recordArray(value[key], `${path}.${key}`, requiredStrings);
}

/** @param {unknown} value @returns {string | null} */
export function publishedSnapshotProblem(value) {
  if (!isRecord(value) || value.schema !== 1) return "schema";
  if (typeof value.revision !== "string" || !/^sha256:[a-f0-9]{64}$/.test(value.revision)) return "revision";
  const content = value.content;
  if (!isRecord(content)) return "content";
  let issue = null;

  for (const key of ["home", "shopHome"]) {
    const page = content[key];
    if (page !== null && (!isRecord(page) || !isRecord(page.hero))) return `content.${key}.hero`;
    if (isRecord(page)) {
      for (const collection of ["orderSteps", "categoryCarousel"]) {
        issue = optionalRecordArray(page, collection, `content.${key}`, collection === "orderSteps" ? ["title", "description"] : ["id"]);
        if (issue) return issue;
      }
      const vehicles = page.vehicles;
      if (vehicles !== undefined && vehicles !== null) {
        if (!isRecord(vehicles)) return `content.${key}.vehicles`;
        issue = optionalRecordArray(vehicles, "slides", `content.${key}.vehicles`, ["title"]);
        if (issue) return issue;
      }
      const catalog = page.catalog;
      if (catalog !== undefined && catalog !== null) {
        if (!isRecord(catalog)) return `content.${key}.catalog`;
        issue = optionalRecordArray(catalog, "tiles", `content.${key}.catalog`, ["categorySlug", "title"]);
        if (issue) return issue;
      }
    }
  }
  if (!isRecord(content.stubs)) return "content.stubs";
  for (const [key, page] of Object.entries(content.stubs)) {
    if (page !== null && (!isRecord(page) || !isRecord(page.hero))) return `content.stubs.${key}.hero`;
    if (isRecord(page)) {
      for (const [collection, fields] of [
        ["features", ["id", "title", "text"]],
        ["sections", ["id", "heading", "body"]],
        ["documents", ["url", "title"]],
      ]) {
        issue = optionalRecordArray(page, collection, `content.stubs.${key}`, fields);
        if (issue) return issue;
      }
    }
  }

  issue = recordArray(content.articles, "content.articles", ["slug", "title", "excerpt", "content"]);
  if (issue) return issue;

  const tires = content.tires;
  if (!isRecord(tires)) return "content.tires";
  issue = recordArray(tires.types, "content.tires.types", ["slug", "name"]);
  if (issue) return issue;
  if (!Array.isArray(tires.models)) return "content.tires.models";
  for (const [groupIndex, group] of tires.models.entries()) {
    const entries = Array.isArray(group) ? group : [group];
    for (const [entryIndex, entry] of entries.entries()) {
      const entryPath = `content.tires.models[${groupIndex}][${entryIndex}]`;
      if (!isRecord(entry) || !isRecord(entry.model)) return `${entryPath}.model`;
      if (typeof entry.model.slug !== "string") return `${entryPath}.model.slug`;
      issue = recordArray(entry.variants, `${entryPath}.variants`);
      if (issue) return issue;
    }
  }

  const wheels = content.wheels;
  if (!isRecord(wheels)) return "content.wheels";
  issue = recordArray(wheels.types, "content.wheels.types", ["slug", "name"]);
  if (issue) return issue;
  if (!Array.isArray(wheels.byType)) return "content.wheels.byType";
  for (const [index, group] of wheels.byType.entries()) {
    const path = `content.wheels.byType[${index}]`;
    if (!isRecord(group)) return path;
    issue = recordArray(group.models, `${path}.models`, ["slug"]);
    if (issue) return issue;
    issue = recordArray(group.variants, `${path}.variants`);
    if (issue) return issue;
  }

  const shop = content.shop;
  if (!isRecord(shop)) return "content.shop";
  issue = recordArray(shop.categories, "content.shop.categories", ["slug", "name"]);
  if (issue) return issue;
  for (const [index, category] of shop.categories.entries()) {
    issue = recordArray(category.carousel, `content.shop.categories[${index}].carousel`, ["title"]);
    if (issue) return issue;
  }
  issue = recordArray(shop.products, "content.shop.products", ["slug", "name"]);
  if (issue) return issue;
  for (const [index, product] of shop.products.entries()) {
    issue = recordArray(product.variants, `content.shop.products[${index}].variants`);
    if (issue) return issue;
    if (!Array.isArray(product.gallery) || product.gallery.some((url) => typeof url !== "string")) {
      return `content.shop.products[${index}].gallery`;
    }
  }

  return null;
}
