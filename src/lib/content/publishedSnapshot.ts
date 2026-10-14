type RecordValue = Record<string, unknown>;

export type PublishedContentSnapshot = {
  schema: 1;
  revision: string;
  content: RecordValue;
};

export type SnapshotResponse = { status: 200 | 404; body: unknown };

function record(value: unknown): RecordValue | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as RecordValue
    : null;
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function notFound(): SnapshotResponse {
  return { status: 404, body: { ok: false } };
}

function found(body: unknown): SnapshotResponse {
  return { status: 200, body };
}

/** Resolve an existing public API path from the single backend publication snapshot. */
export function resolvePublishedSnapshotResponse(
  snapshot: PublishedContentSnapshot,
  requestPath: string,
): SnapshotResponse {
  let url: URL;
  try {
    url = new URL(requestPath, "http://snapshot.local");
  } catch {
    return notFound();
  }

  const content = snapshot.content;
  const segments = url.pathname.split("/").filter(Boolean).map((part) => {
    try { return decodeURIComponent(part); } catch { return ""; }
  });
  const [version, area, kind, identity, detail] = segments;
  if (version !== "v1") return notFound();

  if (area === "pages" && segments.length === 3) {
    const key = kind;
    const page = key === "home" ? content.home
      : key === "shop-home" ? content.shopHome
        : record(content.stubs)?.[key];
    return page == null ? notFound() : found(page);
  }

  if (area === "articles") {
    const articles = array(content.articles);
    if (segments.length === 2) return found(articles);
    if (segments.length === 3) {
      const article = articles.find((item) => record(item)?.slug === kind);
      return article == null ? notFound() : found(article);
    }
  }

  if (area === "tires") {
    const tires = record(content.tires) ?? {};
    const types = array(tires.types);
    const modelsByType = array(tires.models).flatMap((group) => {
      const entries = Array.isArray(group) ? group : [group];
      return entries.flatMap((entry) => {
        const pair = record(entry);
        const model = record(pair?.model);
        return model ? [{ model, variants: array(pair?.variants) }] : [];
      });
    });
    if (kind === "types" && segments.length === 3) return found(types);
    if (kind === "types" && segments.length === 4) {
      const type = types.find((item) => record(item)?.slug === identity);
      return type == null ? notFound() : found(type);
    }
    if (kind === "types" && detail === "models" && segments.length === 5) {
      const type = types.find((item) => record(item)?.slug === identity);
      if (type == null) return notFound();
      return found(modelsByType.filter(({ model }) => model.tireTypeSlug === identity).map(({ model }) => model));
    }
    if (kind === "models" && detail !== "variants" && segments.length === 5) {
      const model = modelsByType.find(({ model }) => model.tireTypeSlug === identity && model.slug === detail)?.model;
      return model == null ? notFound() : found(model);
    }
    if (kind === "models" && detail === "variants" && segments.length === 5) {
      const model = modelsByType.find(({ model }) => model.id === identity);
      return model ? found(model.variants) : found([]);
    }
  }

  if (area === "wheels") {
    const wheels = record(content.wheels) ?? {};
    const types = array(wheels.types);
    const byType = array(wheels.byType);
    const groups = types.map((type, index) => ({
      type: record(type),
      group: record(byType[index]),
    }));
    if (kind === "types" && segments.length === 3) return found(types);
    if (kind === "types" && segments.length === 4) {
      const type = types.find((item) => record(item)?.slug === identity);
      return type == null ? notFound() : found(type);
    }
    if (kind === "types" && detail === "models" && segments.length === 5) {
      const group = groups.find(({ type }) => type?.slug === identity)?.group;
      return group ? found(array(group.models)) : notFound();
    }
    if (kind === "types" && detail === "variants" && segments.length === 5) {
      const group = groups.find(({ type }) => type?.slug === identity)?.group;
      return group ? found(array(group.variants)) : notFound();
    }
    if (kind === "models" && detail !== "variants" && segments.length === 5) {
      const group = groups.find(({ type }) => type?.slug === identity)?.group;
      const model = array(group?.models).find((item) => record(item)?.slug === detail);
      return model == null ? notFound() : found(model);
    }
    if (kind === "models" && detail === "variants" && segments.length === 5) {
      const variants = groups.flatMap(({ group }) => array(group?.variants));
      return found(variants.filter((item) => record(item)?.modelId === identity));
    }
  }

  if (area === "shop") {
    const shop = record(content.shop) ?? {};
    const categories = array(shop.categories);
    const products = array(shop.products);
    if (kind === "categories" && segments.length === 3) return found(categories);
    if (kind === "categories" && segments.length === 4) {
      const category = categories.find((item) => record(item)?.slug === identity);
      return category == null ? notFound() : found(category);
    }
    if (kind === "products" && segments.length === 3) {
      const category = url.searchParams.get("category")?.trim();
      return found(category ? products.filter((item) => record(item)?.categorySlug === category) : products);
    }
    if (kind === "products" && segments.length === 4) {
      const product = products.find((item) => record(item)?.slug === identity);
      return product == null ? notFound() : found(product);
    }
  }

  return notFound();
}

export function isPublishedContentSnapshot(value: unknown): value is PublishedContentSnapshot {
  const candidate = record(value);
  const content = record(candidate?.content);
  const tires = record(content?.tires);
  const wheels = record(content?.wheels);
  const shop = record(content?.shop);
  return candidate?.schema === 1
    && typeof candidate.revision === "string"
    && /^sha256:[a-f0-9]{64}$/.test(candidate.revision)
    && content !== null
    && (content.home === null || record(content.home) !== null)
    && (content.shopHome === null || record(content.shopHome) !== null)
    && record(content.stubs) !== null
    && Array.isArray(content.articles)
    && Array.isArray(tires?.types)
    && Array.isArray(tires?.models)
    && Array.isArray(wheels?.types)
    && Array.isArray(wheels?.byType)
    && Array.isArray(shop?.categories)
    && Array.isArray(shop?.products);
}
