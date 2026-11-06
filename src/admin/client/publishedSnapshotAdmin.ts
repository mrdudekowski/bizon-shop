import { AdminClientError } from "@/admin/client/errors";
import type { AdminClient } from "@/admin/client/adminClient";
import type { CatalogAxle } from "@/admin/domain/options";
import type {
  AdminSession,
  ArticleDraft,
  EntityRecord,
  ImagePlacement,
  MediaListItem,
  PageCta,
  PageDraft,
  PageKey,
  PageSectionCopy,
  SiteProfileDraft,
  ShopCategoryDraft,
  ShopProductDraft,
  TireDirection,
  TireDirectionDraft,
  TireModelDraft,
  TireModelListItem,
  TireSizeDraft,
  WheelModelDraft,
  WheelTypeDraft,
  WheelVariantDraft,
} from "@/admin/domain/types";
import { PAGE_KEYS } from "@/admin/domain/types";

const AXLES = new Set<CatalogAxle>(["steer", "drive", "trailer"]);
const SNAPSHOT_NOTICE = "Показан опубликованный снимок сайта. Боевой API не ответил, поэтому это чтение, а не запись в базу.";

type SnapshotReads = {
  [K in keyof AdminClient]?: AdminClient[K];
};

function record(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function published<T>(id: string, draft: T, slugLocked = true): EntityRecord<T> {
  return {
    id,
    draft,
    savedDraft: draft,
    publishedSnapshot: draft,
    hidden: false,
    slugLocked,
    lastSavedBy: null,
    lastPublishedBy: null,
  };
}

function placement(url: unknown, alt = ""): ImagePlacement | undefined {
  if (typeof url !== "string" || url.trim() === "") return undefined;
  return {
    assetId: url,
    alt,
    focalX: 0.5,
    focalY: 0.5,
    crop: { x: 0, y: 0, width: 1, height: 1 },
  };
}

function section(value: unknown): PageSectionCopy {
  const item = record(value);
  return { eyebrow: text(item?.eyebrow), title: text(item?.title), lead: text(item?.lead) };
}

function cta(value: unknown): PageCta {
  const item = record(value);
  return { label: text(item?.label), href: text(item?.href) };
}

function emptySection(): PageSectionCopy {
  return { eyebrow: "", title: "", lead: "" };
}

function asset(url: string): MediaListItem {
  const name = url.split("/").pop() || "image";
  return { id: url, name, mimeType: "image/jpeg", dataUrl: url, usedBy: [] };
}

function remember(assets: Map<string, MediaListItem>, url: unknown) {
  if (typeof url === "string" && url.trim() !== "" && !assets.has(url)) assets.set(url, asset(url));
}

function homeDraft(value: unknown, assets: Map<string, MediaListItem>): PageDraft {
  const page = record(value);
  const hero = record(page?.hero);
  const expertise = record(page?.expertise);
  const branding = record(page?.branding);
  const shopCampaign = record(page?.shopCampaign);
  remember(assets, hero?.imageUrl);
  remember(assets, expertise?.imageUrl);
  remember(assets, branding?.beforeImageUrl);
  remember(assets, branding?.afterImageUrl);
  remember(assets, shopCampaign?.imageUrl);
  return {
    id: "home",
    seoTitle: text(page?.seoTitle),
    seoDescription: text(page?.seoDescription),
    hero: {
      ...section(hero),
      image: placement(hero?.imageUrl, text(hero?.imageAlt)),
      primaryCta: cta(hero?.primaryCta),
      secondaryCta: cta(hero?.secondaryCta),
      metricLabel: text(hero?.metricLabel),
      metricText: text(hero?.metricText),
    },
    directions: section(page?.directions),
    expertise: { ...section(expertise), image: placement(expertise?.imageUrl, text(expertise?.imageAlt)), cta: cta(expertise?.cta) },
    branding: {
      ...section(branding),
      cta: cta(branding?.cta),
      beforeCaption: text(branding?.beforeCaption),
      afterCaption: text(branding?.afterCaption),
      beforeImage: placement(branding?.beforeImageUrl, text(branding?.beforeImageAlt)),
      afterImage: placement(branding?.afterImageUrl, text(branding?.afterImageAlt)),
    },
    shopCampaign: { ...section(shopCampaign), image: placement(shopCampaign?.imageUrl, text(shopCampaign?.imageAlt)), cta: cta(shopCampaign?.cta) },
  };
}

function shopHomeDraft(value: unknown, assets: Map<string, MediaListItem>): PageDraft {
  const page = record(value);
  const hero = record(page?.hero);
  remember(assets, hero?.imageUrl);
  return {
    id: "shop-home",
    seoTitle: text(page?.seoTitle),
    seoDescription: text(page?.seoDescription),
    hero: { ...section(hero), image: placement(hero?.imageUrl, text(hero?.imageAlt)), cta: cta(hero?.cta) },
    wheelsIntro: { ...emptySection(), kicker: "" },
    orderSteps: [],
    categoryCarousel: [],
    catalog: {
      copy: { eyebrow: "", title: "", lead: "", sectionTitle: "" },
      tiles: [],
    },
    vehicles: { ...emptySection(), cta: { label: "", href: "" }, slides: [] },
  };
}

function stubDraft(key: PageKey, value: unknown, assets: Map<string, MediaListItem>): PageDraft {
  const page = record(value);
  const hero = record(page?.hero);
  const proof = record(page?.proof);
  remember(assets, hero?.imageUrl);
  remember(assets, proof?.imageUrl);
  const features = Array.isArray(page?.features) ? page.features.flatMap((item) => {
    const feature = record(item);
    if (!feature) return [];
    return [{ id: text(feature.id), title: text(feature.title), text: text(feature.text) }];
  }) : [];
  const sections = Array.isArray(page?.sections) ? page.sections.flatMap((item) => {
    const sectionItem = record(item);
    if (!sectionItem) return [];
    return [{ id: text(sectionItem.id), heading: text(sectionItem.heading), body: text(sectionItem.body) }];
  }) : [];
  const siteProfile = key === "contact" ? siteProfileFromSnapshot(page?.siteProfile) : undefined;
  return {
    id: key as Exclude<PageKey, "home" | "shop-home">,
    seoTitle: text(page?.seoTitle),
    seoDescription: text(page?.seoDescription),
    hero: { ...section(hero), image: placement(hero?.imageUrl, text(hero?.imageAlt)) },
    documents: [],
    featuresHeading: text(page?.featuresHeading),
    features,
    sections,
    proof: proof ? { image: placement(proof.imageUrl, text(proof.imageAlt)), title: text(proof.title), text: text(proof.text) } : null,
    cta: page?.cta == null ? null : { ...cta(page.cta), secondaryLabel: text(record(page.cta)?.secondaryLabel), secondaryHref: text(record(page.cta)?.secondaryHref) },
    ...(siteProfile ? { siteProfile } : {}),
  };
}

function siteProfileFromSnapshot(value: unknown): SiteProfileDraft | undefined {
  const profile = record(value);
  if (!profile) return undefined;
  const channels = Array.isArray(profile.channels) ? profile.channels.flatMap((item) => {
    const channel = record(item);
    if (!channel) return [];
    return [{ id: text(channel.id), label: text(channel.label), href: text(channel.href), enabled: channel.enabled === true }];
  }) : [];
  const requisites = Array.isArray(profile.requisites) ? profile.requisites.flatMap((item) => {
    const requisite = record(item);
    if (!requisite) return [];
    return [{ id: text(requisite.id), label: text(requisite.label), value: text(requisite.value) }];
  }) : [];
  return {
    phone: text(profile.phone),
    email: text(profile.email),
    address: text(profile.address),
    channels,
    legalSummary: text(profile.legalSummary),
    priceNotice: text(profile.priceNotice),
    madeToOrderNotice: text(profile.madeToOrderNotice),
    requisites,
    contactSurface: profile.contactSurface === "card" ? "card" : "form",
  };
}

function tireSize(value: unknown, index: number): TireSizeDraft {
  const item = record(value) ?? {};
  return {
    id: text(item.id) || `size-${index + 1}`,
    size: text(item.size),
    priceOnRequest: item.priceOnRequest !== false,
    available: item.available !== false,
    rimDiameter: numberOrUndefined(item.rimDiameter),
    overallDiameter: numberOrUndefined(item.overallDiameter),
    sectionWidth: numberOrUndefined(item.sectionWidth),
    treadDepth: numberOrUndefined(item.treadDepth),
    loadIndex: text(item.loadIndex) || undefined,
    loadIndexDual: text(item.loadIndexDual) || undefined,
    speedIndex: text(item.speedIndex) || undefined,
    plyRating: text(item.plyRating) || undefined,
  };
}

function isSnapshot(value: unknown): value is { content: Record<string, unknown> } {
  const item = record(value);
  return item?.schema === 1
    && typeof item.revision === "string"
    && /^sha256:[a-f0-9]{64}$/.test(item.revision)
    && record(item.content) != null;
}

export function publishedSnapshotReads(snapshot: unknown): SnapshotReads {
  if (!isSnapshot(snapshot)) throw new AdminClientError("invalid_response");
  const content = snapshot.content;
  const assets = new Map<string, MediaListItem>();
  const tires = record(content.tires);
  const wheels = record(content.wheels);
  const shop = record(content.shop);
  const stubs = record(content.stubs) ?? {};
  const types = Array.isArray(tires?.types) ? tires.types : [];
  const typeBySlug = new Map<string, Record<string, unknown>>();
  for (const type of types) {
    const item = record(type);
    if (item && text(item.slug)) typeBySlug.set(text(item.slug), item);
  }

  const directions: TireDirection[] = types.flatMap((type) => {
    const item = record(type);
    if (!item || !text(item.slug)) return [];
    remember(assets, item.imageUrl);
    return [{
      id: text(item.slug),
      name: text(item.name),
      slug: text(item.slug),
      status: "on_site" as const,
      hasUnpublishedDraft: false,
      imageAssetId: text(item.imageUrl) || null,
    }];
  });

  const tireModels: { list: TireModelListItem; draft: TireModelDraft }[] = [];
  const modelGroups = Array.isArray(tires?.models) ? tires.models : [];
  for (const group of modelGroups) {
    const entries = Array.isArray(group) ? group : [group];
    for (const entry of entries) {
      const pair = record(entry);
      const model = record(pair?.model ?? entry);
      if (!model || !text(model.slug)) continue;
      const directionSlug = text(model.tireTypeSlug);
      remember(assets, model.imageUrl);
      const gallery = Array.isArray(model.gallery) ? model.gallery.flatMap((item) => {
        const image = typeof item === "string" ? placement(item) : placement(record(item)?.url ?? record(item)?.imageUrl);
        if (image) remember(assets, image.assetId);
        return image ? [image] : [];
      }) : [];
      const draft: TireModelDraft = {
        id: text(model.id) || text(model.slug),
        name: text(model.name),
        slug: text(model.slug),
        directionId: directionSlug,
        mainImage: placement(model.imageUrl),
        gallery,
        advantages: [],
        documents: [],
        sizes: (Array.isArray(pair?.variants) ? pair.variants : []).map(tireSize),
        brand: text(model.brand),
        descriptionShort: text(model.descriptionShort),
        descriptionLong: text(model.descriptionLong),
        treadType: text(model.treadType),
        features: Array.isArray(model.advantages) ? model.advantages.flatMap((item) => {
          const advantage = record(item);
          if (!advantage) return [];
          return [{ id: text(advantage.key), key: text(advantage.key), title: text(advantage.title), description: text(advantage.description) }];
        }) : [],
        applicationTypes: Array.isArray(model.applicationTypes) ? model.applicationTypes.filter((item): item is string => typeof item === "string") : [],
        selectionAxles: Array.isArray(model.selectionAxles)
          ? model.selectionAxles.filter((item): item is CatalogAxle => typeof item === "string" && AXLES.has(item as CatalogAxle))
          : [],
        available: model.available !== false,
        showInMenu: model.showInMenu === true,
        menuOrder: numberOrUndefined(model.menuOrder) ?? 0,
      };
      tireModels.push({
        list: {
          id: draft.id,
          name: draft.name,
          directionId: directionSlug,
          directionName: text(typeBySlug.get(directionSlug)?.name),
          sizeCount: draft.sizes.length,
          status: "on_site",
          hasUnpublishedDraft: false,
          imageAssetId: draft.mainImage?.assetId ?? null,
          menuOrder: draft.menuOrder,
        },
        draft,
      });
    }
  }

  const wheelTypes = (Array.isArray(wheels?.types) ? wheels.types : []).flatMap((type) => {
    const item = record(type);
    if (!item || !text(item.slug)) return [];
    remember(assets, item.imageUrl);
    const draft: WheelTypeDraft = {
      id: text(item.slug),
      name: text(item.name),
      slug: text(item.slug),
      description: text(item.description),
      shortDescription: text(item.descriptionShort),
      mainImage: placement(item.imageUrl),
      sortOrder: numberOrUndefined(item.sortOrder) ?? 0,
      showInMenu: item.showInMenu === true,
    };
    return [published(draft.id, draft, false)];
  });
  const wheelGroups = Array.isArray(wheels?.byType) ? wheels.byType : [];
  const wheelModels: { list: { id: string; name: string; typeName: string; wheelTypeId: string; imageAssetId: string | null; status: "on_site"; hasUnpublishedDraft: false; menuOrder: number }; draft: WheelModelDraft }[] = [];
  wheelTypes.forEach((type, index) => {
    const group = record(wheelGroups[index]);
    const models = Array.isArray(group?.models) ? group.models : [];
    for (const modelValue of models) {
      const model = record(modelValue);
      if (!model || !text(model.slug)) continue;
      remember(assets, model.imageUrl);
      const variants: WheelVariantDraft[] = (Array.isArray(group?.variants) ? group.variants : []).flatMap((variantValue) => {
        const variant = record(variantValue);
        if (!variant || text(variant.modelId) !== (text(model.id) || text(model.slug))) return [];
        return [{
          id: text(variant.id) || text(variant.sizeLabel),
          sizeLabel: text(variant.sizeLabel) || text(variant.size),
          pcd: text(variant.pcd),
          color: text(variant.color),
          priceOnRequest: variant.priceOnRequest !== false,
          available: variant.available !== false,
          price: numberOrUndefined(variant.price),
        }];
      });
      const draft: WheelModelDraft = {
        id: text(model.id) || text(model.slug),
        name: text(model.name),
        slug: text(model.slug),
        wheelTypeId: type.id,
        series: text(model.series),
        material: text(model.material),
        constructionMethod: text(model.constructionMethod),
        fitmentNotes: text(model.fitmentNotes),
        descriptionShort: text(model.descriptionShort),
        descriptionLong: text(model.descriptionLong),
        mainImage: placement(model.imageUrl),
        gallery: [],
        documents: [],
        available: model.available !== false,
        showInMenu: model.showInMenu === true,
        menuOrder: numberOrUndefined(model.menuOrder) ?? 0,
        variants,
      };
      wheelModels.push({
        list: {
          id: draft.id,
          name: draft.name,
          typeName: type.draft.name,
          wheelTypeId: type.id,
          imageAssetId: draft.mainImage?.assetId ?? null,
          status: "on_site",
          hasUnpublishedDraft: false,
          menuOrder: draft.menuOrder,
        },
        draft,
      });
    }
  });

  const categories = (Array.isArray(shop?.categories) ? shop.categories : []).flatMap((categoryValue) => {
    const category = record(categoryValue);
    if (!category || !text(category.slug)) return [];
    remember(assets, category.imageUrl);
    const draft: ShopCategoryDraft = {
      id: text(category.id) || text(category.slug),
      name: text(category.name),
      slug: text(category.slug),
      description: text(category.description),
      mainImage: placement(category.imageUrl),
      carousel: [],
      sortOrder: numberOrUndefined(category.sortOrder) ?? 0,
      showInMenu: category.showInMenu === true,
    };
    return [published(draft.id, draft, false)];
  });
  const categoryBySlug = new Map(categories.map((category) => [category.draft.slug, category]));
  const products = (Array.isArray(shop?.products) ? shop.products : []).flatMap((productValue) => {
    const product = record(productValue);
    if (!product || !text(product.slug)) return [];
    remember(assets, product.imageUrl);
    const category = categoryBySlug.get(text(product.categorySlug));
    const draft: ShopProductDraft = {
      id: text(product.id) || text(product.slug),
      name: text(product.name),
      slug: text(product.slug),
      categoryId: category?.id ?? text(product.categorySlug),
      descriptionShort: text(product.descriptionShort),
      descriptionLong: text(product.descriptionLong),
      priceOnRequest: product.priceOnRequest !== false,
      price: numberOrUndefined(product.price),
      mainImage: placement(product.imageUrl),
      gallery: [],
      available: product.available !== false,
      variants: [],
    };
    return [{
      list: {
        id: draft.id,
        name: draft.name,
        categoryName: category?.draft.name ?? "",
        categoryId: draft.categoryId,
        categoryPublished: category != null,
        isPublished: true,
        imageAssetId: draft.mainImage?.assetId ?? null,
        status: "on_site" as const,
        hasUnpublishedDraft: false,
        sortOrder: numberOrUndefined(product.sortOrder),
      },
      draft,
    }];
  });

  const articles = (Array.isArray(content.articles) ? content.articles : []).flatMap((articleValue) => {
    const article = record(articleValue);
    if (!article || !text(article.slug)) return [];
    remember(assets, article.imageUrl);
    const draft: ArticleDraft = {
      id: text(article.slug),
      kind: "article",
      title: text(article.title),
      slug: text(article.slug),
      excerpt: text(article.excerpt),
      body: text(article.content),
      image: placement(article.imageUrl),
      imageConfigured: article.imageConfigured === true,
      gallery: [],
      showInMenu: article.showInMenu === true,
      menuOrder: numberOrUndefined(article.menuOrder) ?? 0,
      taxonomy: Array.isArray(article.taxonomy) ? article.taxonomy.filter((item): item is string => typeof item === "string") : [],
    };
    return [published(draft.id, draft)];
  });

  const pages = PAGE_KEYS.map((key) => {
    const draft = key === "home"
      ? homeDraft(content.home, assets)
      : key === "shop-home"
        ? shopHomeDraft(content.shopHome, assets)
        : stubDraft(key, stubs[key], assets);
    return published(key, draft);
  });

  const session: AdminSession = { login: "снимок", role: "admin", capabilities: [] };

  return {
    async getSession() { return session; },
    async storageNotice() { return SNAPSHOT_NOTICE; },
    async listAssets() { return [...assets.values()]; },
    async listTireDirections() { return directions; },
    async getTireDirection(id: string) {
      const direction = directions.find((item) => item.id === id);
      if (!direction) throw new AdminClientError("not_found");
      const source = typeBySlug.get(direction.slug);
      const draft: TireDirectionDraft = {
        id: direction.id,
        name: direction.name,
        slug: direction.slug,
        description: text(source?.description),
        shortDescription: text(source?.descriptionShort),
        mainImage: placement(source?.imageUrl),
        sortOrder: numberOrUndefined(source?.sortOrder) ?? 0,
        showInMenu: source?.showInMenu === true,
      };
      return published(direction.id, draft, false);
    },
    async listTireModels() { return tireModels.map((item) => item.list); },
    async getTireModel(id: string) {
      const model = tireModels.find((item) => item.draft.id === id);
      if (!model) throw new AdminClientError("not_found");
      return published(model.draft.id, model.draft, false);
    },
    async listWheelTypes() { return wheelTypes; },
    async getWheelType(id: string) {
      const type = wheelTypes.find((item) => item.id === id);
      if (!type) throw new AdminClientError("not_found");
      return type;
    },
    async listWheelModels() { return wheelModels.map((item) => item.list); },
    async getWheelModel(id: string) {
      const model = wheelModels.find((item) => item.draft.id === id);
      if (!model) throw new AdminClientError("not_found");
      return published(model.draft.id, model.draft, false);
    },
    async listShopCategories() { return categories; },
    async getShopCategory(id: string) {
      const category = categories.find((item) => item.id === id);
      if (!category) throw new AdminClientError("not_found");
      return category;
    },
    async listShopSubcategories() { return []; },
    async listShopProducts() { return products.map((item) => item.list); },
    async getShopProduct(id: string) {
      const product = products.find((item) => item.draft.id === id);
      if (!product) throw new AdminClientError("not_found");
      return published(product.draft.id, product.draft, false);
    },
    async listPages() { return pages; },
    async getPage(key: PageKey) {
      const page = pages.find((item) => item.id === key);
      if (!page) throw new AdminClientError("not_found");
      return page;
    },
    async listMaterials() {
      return articles.map((article) => ({
        id: article.id,
        title: article.draft.title,
        kind: "article" as const,
        imageAssetId: article.draft.image?.assetId ?? null,
        status: "on_site" as const,
        hasUnpublishedDraft: false,
        menuOrder: article.draft.menuOrder,
      }));
    },
    async getMaterial(id: string) {
      const article = articles.find((item) => item.id === id);
      if (!article) throw new AdminClientError("not_found");
      return article;
    },
    async listChangeSets() { return []; },
    async listUsers() { return []; },
    async listRequests() { return []; },
  };
}

const snapshotReadsByUrl = new Map<string, Promise<SnapshotReads>>();

function loadSnapshotReads(snapshotUrl: string): Promise<SnapshotReads> {
  const cached = snapshotReadsByUrl.get(snapshotUrl);
  if (cached) return cached;
  const pending = fetch(snapshotUrl, { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) throw new AdminClientError("invalid_response");
      return publishedSnapshotReads(await response.json());
    })
    .catch((error: unknown) => {
      snapshotReadsByUrl.delete(snapshotUrl);
      throw error;
    });
  snapshotReadsByUrl.set(snapshotUrl, pending);
  return pending;
}

const SNAPSHOT_READS = new Set<string>([
  "getSession",
  "storageNotice",
  "listAssets",
  "listTireDirections",
  "getTireDirection",
  "listTireModels",
  "getTireModel",
  "listWheelTypes",
  "getWheelType",
  "listWheelModels",
  "getWheelModel",
  "listShopCategories",
  "getShopCategory",
  "listShopSubcategories",
  "listShopProducts",
  "getShopProduct",
  "listPages",
  "getPage",
  "listMaterials",
  "getMaterial",
  "listChangeSets",
  "listUsers",
  "listRequests",
]);

/** Use the remote admin API. If it cannot answer, read the published site snapshot. */
export function withPublishedSnapshotFallback(remote: AdminClient, snapshotUrl: string): AdminClient {
  return new Proxy(remote, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof property !== "string" || typeof value !== "function" || !SNAPSHOT_READS.has(property)) return value;
      return async (...args: unknown[]) => {
        try {
          return await (value as (...methodArgs: unknown[]) => Promise<unknown>).apply(target, args);
        } catch (error) {
          if (!(error instanceof AdminClientError) || (error.code !== "network" && error.code !== "invalid_response")) {
            throw error;
          }
          try {
            const reads = await loadSnapshotReads(snapshotUrl);
            const method = reads[property as keyof SnapshotReads] as ((...methodArgs: unknown[]) => Promise<unknown>) | undefined;
            if (!method) throw error;
            return await method(...args);
          } catch (snapshotError) {
            if (snapshotError instanceof AdminClientError && snapshotError.code === "not_found") throw snapshotError;
            throw error;
          }
        }
      };
    },
  });
}
