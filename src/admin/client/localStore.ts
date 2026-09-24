import {
  articlePublishBlockers,
  shopProductPublishBlockers,
  tireDirectionPublishBlockers,
  tireModelPublishBlockers,
  wheelModelPublishBlockers,
  wheelTypePublishBlockers,
} from "@/admin/domain/publishRules";
import { isValidSlug, slugifyTitle } from "@/admin/domain/slug";
import { PAGE_KEYS } from "@/admin/domain/types";
import type {
  AdminSession,
  DocumentStatus,
  ImagePlacement,
  MediaAsset,
  ShopCategoryDraft,
  ShopProductDraft,
  TireDirection,
  TireDirectionDraft,
  TireModelDraft,
  TireModelListItem,
  TireModelRecord,
  WheelModelDraft,
  WheelTypeDraft,
  ArticleDraft,
  PageCta,
  PageDraft,
  PageKey,
  PageSectionCopy,
  MediaListItem,
  AdminUser,
  EntityRecord,
  DocumentLink,
} from "@/admin/domain/types";

import type { AdminClient } from "./adminClient";
import { AdminClientError } from "./errors";

export const LOCAL_STORAGE_KEY = "bizon.frontend-cms";

export type AdminStorage = {
  read(): string | null;
  write(value: string): void;
};

type StoreState = {
  session: AdminSession;
  directions: EntityRecord<TireDirectionDraft>[];
  assets: MediaAsset[];
  models: TireModelRecord[];
  wheelTypes: EntityRecord<WheelTypeDraft>[];
  wheelModels: EntityRecord<WheelModelDraft>[];
  shopCategories: EntityRecord<ShopCategoryDraft>[];
  shopProducts: EntityRecord<ShopProductDraft>[];
  pages: EntityRecord<PageDraft>[];
  materials: EntityRecord<ArticleDraft>[];
  users: AdminUser[];
};

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function clampPlacement(placement: ImagePlacement): ImagePlacement {
  return {
    ...placement,
    focalX: clamp01(placement.focalX),
    focalY: clamp01(placement.focalY),
    crop: {
      x: clamp01(placement.crop.x),
      y: clamp01(placement.crop.y),
      width: clamp01(placement.crop.width),
      height: clamp01(placement.crop.height),
    },
  };
}

function looksLikePlacement(value: unknown): value is ImagePlacement {
  return (
    value != null &&
    typeof value === "object" &&
    "assetId" in value &&
    "focalX" in value &&
    "focalY" in value &&
    "crop" in value
  );
}

/** Clamp every ImagePlacement nested in a draft. */
function clampDeep<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => clampDeep(item)) as T;
  if (value != null && typeof value === "object") {
    if (looksLikePlacement(value)) return clampPlacement(value) as T;
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      out[key] = clampDeep(child);
    }
    return out as T;
  }
  return value;
}

function emptySection(): PageSectionCopy {
  return { eyebrow: "", title: "", lead: "" };
}

function emptyCta(): PageCta {
  return { label: "", href: "" };
}

function emptyPageDraft(key: PageKey): PageDraft {
  if (key === "home") {
    return {
      id: "home",
      seoTitle: "",
      seoDescription: "",
      hero: {
        ...emptySection(),
        primaryCta: emptyCta(),
        secondaryCta: emptyCta(),
        metricLabel: "",
        metricText: "",
      },
      selectionEntry: emptySection(),
      directions: emptySection(),
      expertise: emptySection(),
      shopCampaign: { ...emptySection(), cta: emptyCta() },
      resume: { ...emptySection(), primaryCta: emptyCta(), secondaryCta: emptyCta() },
    };
  }
  if (key === "shop-home") {
    return {
      id: "shop-home",
      seoTitle: "",
      seoDescription: "",
      hero: { ...emptySection(), cta: emptyCta() },
      wheelsIntro: { ...emptySection(), kicker: "" },
      orderSteps: [],
      categoryCarousel: [],
      vehicles: { ...emptySection(), cta: emptyCta(), slides: [] },
    };
  }
  return {
    id: key,
    seoTitle: "",
    seoDescription: "",
    hero: emptySection(),
  };
}

function emptyDraft(id: string, name: string, slug: string, directionId: string): TireModelDraft {
  return {
    id,
    name,
    slug,
    directionId,
    gallery: [],
    advantages: [],
    documents: [],
    sizes: [],
    brand: "",
    descriptionShort: "",
    descriptionLong: "",
    applicationCategory: "",
    treadType: "",
    selectionVehicleTypes: [],
    selectionConditions: [],
    selectionAxles: [],
    showInMenu: false,
    menuOrder: 0,
  };
}

function emptyDirectionDraft(id: string, name: string, slug: string): TireDirectionDraft {
  return {
    id,
    name,
    slug,
    description: "",
    shortDescription: "",
    sortOrder: 0,
    showInMenu: false,
    selectionVehicleTypes: [],
    selectionConditions: [],
  };
}

function wrapDirection(flat: TireDirection): EntityRecord<TireDirectionDraft> {
  const draft = emptyDirectionDraft(flat.id, flat.name, flat.slug);
  return {
    id: flat.id,
    draft,
    savedDraft: draft,
    publishedSnapshot: null,
    hidden: false,
    slugLocked: true,
    lastSavedBy: null,
    lastPublishedBy: null,
  };
}

function emptyPage(key: PageKey): EntityRecord<PageDraft> {
  const draft = emptyPageDraft(key);
  return {
    id: key,
    draft,
    savedDraft: draft,
    publishedSnapshot: null,
    hidden: false,
    slugLocked: true,
    lastSavedBy: null,
    lastPublishedBy: null,
  };
}

function seed(): StoreState {
  return {
    session: { login: "admin", role: "admin" },
    directions: [wrapDirection({ id: "dir-long-haul", name: "Магистральные", slug: "long-haul" })],
    assets: [],
    models: [],
    wheelTypes: [],
    wheelModels: [],
    shopCategories: [],
    shopProducts: [],
    pages: PAGE_KEYS.map(emptyPage),
    materials: [],
    users: [{ id: "user-admin", login: "admin", role: "admin", disabled: false }],
  };
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function listStatus(record: { hidden: boolean; publishedSnapshot: unknown }): DocumentStatus {
  if (record.hidden) return "hidden";
  if (record.publishedSnapshot == null) return "draft";
  return "on_site";
}

function requireNamed<T extends { id: string }>(records: EntityRecord<T>[], id: string): EntityRecord<T> {
  const record = records.find((item) => item.id === id);
  if (record == null) throw new Error("not_found");
  return record;
}

function createNamed<T extends { id: string; slug: string }>(
  load: () => StoreState,
  save: (state: StoreState) => void,
  pick: (state: StoreState) => EntityRecord<T>[],
  name: string,
  build: (id: string, slug: string) => T,
): EntityRecord<T> {
  const state = load();
  const slug = slugifyTitle(name);
  if (!isValidSlug(slug)) throw new AdminClientError("invalid_slug");
  const records = pick(state);
  if (records.some((item) => item.draft.slug === slug)) throw new AdminClientError("slug_taken");
  const id = crypto.randomUUID();
  const record: EntityRecord<T> = {
    id,
    draft: build(id, slug),
    savedDraft: null,
    publishedSnapshot: null,
    hidden: false,
    slugLocked: false,
    lastSavedBy: null,
    lastPublishedBy: null,
  };
  records.push(record);
  save(state);
  return record;
}

function saveNamed<T extends { id: string; slug: string }>(
  load: () => StoreState,
  save: (state: StoreState) => void,
  pick: (state: StoreState) => EntityRecord<T>[],
  id: string,
  draft: T,
): EntityRecord<T> {
  const state = load();
  const record = requireNamed(pick(state), id);
  if (record.slugLocked && draft.slug !== record.draft.slug) throw new AdminClientError("invalid_slug");
  if (!isValidSlug(draft.slug)) throw new AdminClientError("invalid_slug");
  const next = clampDeep({ ...draft, id });
  record.draft = next;
  record.savedDraft = next;
  record.lastSavedBy = state.session.login;
  save(state);
  return record;
}

function publishNamed<T extends { id: string; slug: string }>(
  load: () => StoreState,
  save: (state: StoreState) => void,
  pick: (state: StoreState) => EntityRecord<T>[],
  id: string,
  blockers: (draft: T) => unknown[],
): EntityRecord<T> {
  const state = load();
  const record = requireNamed(pick(state), id);
  if (record.savedDraft == null || !sameJson(record.draft, record.savedDraft)) {
    throw new AdminClientError("unsaved");
  }
  if (blockers(record.savedDraft).length > 0) throw new AdminClientError("publish_blocked");
  record.publishedSnapshot = record.savedDraft;
  record.slugLocked = true;
  record.hidden = false;
  record.lastPublishedBy = state.session.login;
  save(state);
  return record;
}

function noteAsset(used: Map<string, string[]>, placement: ImagePlacement | undefined, label: string): void {
  if (placement == null) return;
  const labels = used.get(placement.assetId) ?? [];
  if (!labels.includes(label)) labels.push(label);
  used.set(placement.assetId, labels);
}

function noteGallery(used: Map<string, string[]>, gallery: ImagePlacement[] | undefined, label: string): void {
  for (const placement of gallery ?? []) noteAsset(used, placement, label);
}

function noteDocuments(used: Map<string, string[]>, documents: DocumentLink[] | undefined, label: string): void {
  for (const doc of documents ?? []) {
    const labels = used.get(doc.assetId) ?? [];
    if (!labels.includes(label)) labels.push(label);
    used.set(doc.assetId, labels);
  }
}

function notePageDraft(used: Map<string, string[]>, page: PageDraft | null | undefined, label: string): void {
  if (page == null) return;
  if (page.id === "home") {
    noteAsset(used, page.hero.image, label);
    noteAsset(used, page.shopCampaign.image, label);
    return;
  }
  if (page.id === "shop-home") {
    noteAsset(used, page.hero.image, label);
    for (const slide of page.categoryCarousel) {
      noteAsset(used, slide.desktopImage, label);
      noteAsset(used, slide.mobileImage, label);
    }
    for (const slide of page.vehicles.slides) {
      noteAsset(used, slide.image, label);
    }
    return;
  }
  noteAsset(used, page.hero.image, label);
}

function noteEntityMedia(used: Map<string, string[]>, draft: object, label: string): void {
  const media = draft as {
    mainImage?: ImagePlacement;
    image?: ImagePlacement;
    gallery?: ImagePlacement[];
    documents?: DocumentLink[];
    variants?: { image?: ImagePlacement }[];
  };
  noteAsset(used, media.mainImage, label);
  noteAsset(used, media.image, label);
  noteGallery(used, media.gallery, label);
  noteDocuments(used, media.documents, label);
  for (const variant of media.variants ?? []) noteAsset(used, variant.image, label);
}

function collectAssetUsage(state: StoreState): Map<string, string[]> {
  const used = new Map<string, string[]>();
  for (const direction of state.directions) {
    noteEntityMedia(used, direction.draft, direction.draft.name);
    if (direction.savedDraft) noteEntityMedia(used, direction.savedDraft, direction.draft.name);
    if (direction.publishedSnapshot) noteEntityMedia(used, direction.publishedSnapshot, direction.draft.name);
  }
  for (const model of state.models) {
    noteEntityMedia(used, model.draft, model.draft.name);
    if (model.savedDraft) noteEntityMedia(used, model.savedDraft, model.draft.name);
    if (model.publishedSnapshot) noteEntityMedia(used, model.publishedSnapshot, model.draft.name);
  }
  for (const record of [...state.wheelTypes, ...state.wheelModels, ...state.shopCategories]) {
    noteEntityMedia(used, record.draft, record.draft.name);
    if (record.savedDraft) noteEntityMedia(used, record.savedDraft, record.draft.name);
    if (record.publishedSnapshot) noteEntityMedia(used, record.publishedSnapshot, record.draft.name);
  }
  for (const product of state.shopProducts) {
    noteEntityMedia(used, product.draft, product.draft.name);
    if (product.savedDraft) noteEntityMedia(used, product.savedDraft, product.draft.name);
    if (product.publishedSnapshot) noteEntityMedia(used, product.publishedSnapshot, product.draft.name);
  }
  for (const page of state.pages) {
    notePageDraft(used, page.draft, page.id);
    notePageDraft(used, page.savedDraft, page.id);
    notePageDraft(used, page.publishedSnapshot, page.id);
  }
  for (const material of state.materials) {
    noteEntityMedia(used, material.draft, material.draft.title);
    if (material.savedDraft) noteEntityMedia(used, material.savedDraft, material.draft.title);
    if (material.publishedSnapshot) noteEntityMedia(used, material.publishedSnapshot, material.draft.title);
  }
  return used;
}

function isDirectionRecord(value: unknown): value is EntityRecord<TireDirectionDraft> {
  return value != null && typeof value === "object" && "draft" in value;
}

function isPageWithHero(value: unknown): value is EntityRecord<PageDraft> {
  if (value == null || typeof value !== "object" || !("draft" in value)) return false;
  const draft = (value as { draft: unknown }).draft;
  return draft != null && typeof draft === "object" && "hero" in draft;
}

function normalizeLoaded(parsed: Partial<StoreState>): StoreState {
  const initial = seed();
  const merged: StoreState = {
    ...initial,
    ...parsed,
    session: parsed.session ?? initial.session,
    directions: initial.directions,
    pages: initial.pages,
  };

  if (Array.isArray(parsed.directions)) {
    merged.directions = parsed.directions.map((item) =>
      isDirectionRecord(item) ? item : wrapDirection(item as TireDirection),
    );
  }

  if (Array.isArray(parsed.pages)) {
    const byKey = new Map(
      parsed.pages
        .filter((page): page is EntityRecord<PageDraft> => page != null && typeof page === "object" && "id" in page)
        .map((page) => [page.id as PageKey, page]),
    );
    merged.pages = PAGE_KEYS.map((key) => {
      const existing = byKey.get(key);
      if (existing != null && isPageWithHero(existing)) return existing;
      return emptyPage(key);
    });
  }

  return merged;
}

export function createLocalAdminClient(storage: AdminStorage): AdminClient {
  let repairedNoticePending = false;

  function load(): StoreState {
    const raw = storage.read();
    if (raw == null) {
      const initial = seed();
      storage.write(JSON.stringify(initial));
      return initial;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<StoreState>;
      return normalizeLoaded(parsed);
    } catch {
      repairedNoticePending = true;
      const initial = seed();
      storage.write(JSON.stringify(initial));
      return initial;
    }
  }

  function save(state: StoreState): void {
    storage.write(JSON.stringify(state));
  }

  function requireModel(state: StoreState, id: string): TireModelRecord {
    const record = state.models.find((item) => item.id === id);
    if (record == null) throw new Error("not_found");
    return record;
  }

  function enabledAdmins(state: StoreState): AdminUser[] {
    return state.users.filter((user) => user.role === "admin" && !user.disabled);
  }

  return {
    async getSession() {
      return load().session;
    },

    async setSessionRole(role) {
      const state = load();
      state.session = { ...state.session, role };
      save(state);
    },

    async listTireDirections() {
      return load().directions.map((record) => ({
        id: record.id,
        name: record.draft.name,
        slug: record.draft.slug,
      }));
    },

    async createTireDirection(input) {
      return createNamed(load, save, (state) => state.directions, input.name, (id, slug) =>
        emptyDirectionDraft(id, input.name.trim(), slug),
      );
    },

    async getTireDirection(id) {
      return requireNamed(load().directions, id);
    },

    async saveTireDirection(id, draft) {
      return saveNamed(load, save, (state) => state.directions, id, draft);
    },

    async publishTireDirection(id) {
      return publishNamed(load, save, (state) => state.directions, id, tireDirectionPublishBlockers);
    },

    async createAsset(file) {
      const state = load();
      const id = crypto.randomUUID();
      state.assets.push({ id, ...file });
      save(state);
      return { id };
    },

    async listTireModels() {
      const state = load();
      return state.models.map((record): TireModelListItem => {
        const direction = state.directions.find((item) => item.id === record.draft.directionId);
        return {
          id: record.id,
          name: record.draft.name,
          directionName: direction?.draft.name ?? "",
          sizeCount: record.draft.sizes.length,
          status: listStatus(record),
          hasUnpublishedDraft:
            record.publishedSnapshot != null &&
            record.savedDraft != null &&
            !sameJson(record.savedDraft, record.publishedSnapshot),
          imageAssetId: record.draft.mainImage?.assetId ?? null,
        };
      });
    },

    async getTireModel(id) {
      return requireModel(load(), id);
    },

    async createTireModel(input) {
      const state = load();
      const slug = slugifyTitle(input.name);
      if (!isValidSlug(slug)) throw new AdminClientError("invalid_slug");
      if (state.models.some((item) => item.draft.slug === slug || item.savedDraft?.slug === slug)) {
        throw new AdminClientError("slug_taken");
      }
      const id = crypto.randomUUID();
      const draft = emptyDraft(id, input.name.trim(), slug, input.directionId);
      const record: TireModelRecord = {
        id,
        draft,
        savedDraft: null,
        publishedSnapshot: null,
        hidden: false,
        slugLocked: false,
        lastSavedBy: null,
        lastPublishedBy: null,
      };
      state.models.push(record);
      save(state);
      return record;
    },

    async saveTireModel(id, draft) {
      const state = load();
      const record = requireModel(state, id);
      if (record.slugLocked && draft.slug !== record.draft.slug) {
        throw new AdminClientError("invalid_slug");
      }
      if (!isValidSlug(draft.slug)) throw new AdminClientError("invalid_slug");
      const taken = state.models.some(
        (item) => item.id !== id && (item.savedDraft?.slug === draft.slug || item.draft.slug === draft.slug),
      );
      if (taken) throw new AdminClientError("slug_taken");
      const next = clampDeep({ ...draft, id });
      record.draft = next;
      record.savedDraft = next;
      record.lastSavedBy = state.session.login;
      save(state);
      return record;
    },

    async publishTireModel(id) {
      const state = load();
      const record = requireModel(state, id);
      if (record.savedDraft == null || !sameJson(record.draft, record.savedDraft)) {
        throw new AdminClientError("unsaved");
      }
      if (tireModelPublishBlockers(record.savedDraft).length > 0) {
        throw new AdminClientError("publish_blocked");
      }
      record.publishedSnapshot = record.savedDraft;
      record.slugLocked = true;
      record.hidden = false;
      record.lastPublishedBy = state.session.login;
      save(state);
      return record;
    },

    async hideTireModel(id) {
      const state = load();
      const record = requireModel(state, id);
      record.hidden = true;
      save(state);
      return record;
    },

    async deleteTireModel(id) {
      const state = load();
      const record = requireModel(state, id);
      if (record.publishedSnapshot != null) throw new AdminClientError("publish_blocked");
      state.models = state.models.filter((item) => item.id !== id);
      save(state);
    },

    async listWheelTypes() {
      return load().wheelTypes;
    },

    async createWheelType(input: { name: string }) {
      return createNamed(load, save, (state) => state.wheelTypes, input.name, (id, slug) => ({
        id,
        name: input.name.trim(),
        slug,
        description: "",
        sortOrder: 0,
        showInMenu: false,
      }));
    },

    async saveWheelType(id: string, draft: WheelTypeDraft) {
      return saveNamed(load, save, (state) => state.wheelTypes, id, draft);
    },

    async publishWheelType(id: string) {
      return publishNamed(load, save, (state) => state.wheelTypes, id, wheelTypePublishBlockers);
    },

    async listWheelModels() {
      const state = load();
      return state.wheelModels.map((record) => ({
        id: record.id,
        name: record.draft.name,
        typeName: state.wheelTypes.find((item) => item.id === record.draft.wheelTypeId)?.draft.name ?? "",
        status: listStatus(record),
      }));
    },

    async createWheelModel(input: { name: string; wheelTypeId: string }) {
      return createNamed(load, save, (state) => state.wheelModels, input.name, (id, slug) => ({
        id,
        name: input.name.trim(),
        slug,
        wheelTypeId: input.wheelTypeId,
        series: "",
        material: "",
        constructionMethod: "",
        fitmentNotes: "",
        descriptionShort: "",
        descriptionLong: "",
        gallery: [],
        documents: [],
        showInMenu: false,
        menuOrder: 0,
        variants: [],
      }));
    },

    async getWheelModel(id: string) {
      return requireNamed(load().wheelModels, id);
    },

    async saveWheelModel(id: string, draft: WheelModelDraft) {
      return saveNamed(load, save, (state) => state.wheelModels, id, draft);
    },

    async publishWheelModel(id: string) {
      return publishNamed(load, save, (state) => state.wheelModels, id, wheelModelPublishBlockers);
    },

    async listShopCategories() {
      return load().shopCategories;
    },

    async createShopCategory(input: { name: string }) {
      return createNamed(load, save, (state) => state.shopCategories, input.name, (id, slug) => ({
        id,
        name: input.name.trim(),
        slug,
        description: "",
        sortOrder: 0,
        showInMenu: false,
      }));
    },

    async saveShopCategory(id: string, draft: ShopCategoryDraft) {
      return saveNamed(load, save, (state) => state.shopCategories, id, draft);
    },

    async publishShopCategory(id: string) {
      return publishNamed(load, save, (state) => state.shopCategories, id, wheelTypePublishBlockers);
    },

    async listShopProducts() {
      const state = load();
      return state.shopProducts.map((record) => ({
        id: record.id,
        name: record.draft.name,
        categoryName: state.shopCategories.find((item) => item.id === record.draft.categoryId)?.draft.name ?? "",
        status: listStatus(record),
      }));
    },

    async createShopProduct(input: { name: string; categoryId: string }) {
      return createNamed(load, save, (state) => state.shopProducts, input.name, (id, slug) => ({
        id,
        name: input.name.trim(),
        slug,
        categoryId: input.categoryId,
        descriptionShort: "",
        descriptionLong: "",
        priceOnRequest: true,
        gallery: [],
        variants: [],
      }));
    },

    async getShopProduct(id: string) {
      return requireNamed(load().shopProducts, id);
    },

    async saveShopProduct(id: string, draft: ShopProductDraft) {
      return saveNamed(load, save, (state) => state.shopProducts, id, draft);
    },

    async publishShopProduct(id: string) {
      return publishNamed(load, save, (state) => state.shopProducts, id, shopProductPublishBlockers);
    },

    async listPages() {
      return load().pages;
    },

    async getPage(key: PageKey) {
      return requireNamed(load().pages, key);
    },

    async savePage(key: PageKey, draft: PageDraft) {
      const state = load();
      const record = requireNamed(state.pages, key);
      const next = clampDeep({ ...draft, id: key } as PageDraft);
      record.draft = next;
      record.savedDraft = next;
      record.lastSavedBy = state.session.login;
      save(state);
      return record;
    },

    async publishPage(key: PageKey) {
      const state = load();
      const record = requireNamed(state.pages, key);
      if (record.savedDraft == null || !sameJson(record.draft, record.savedDraft)) {
        throw new AdminClientError("unsaved");
      }
      record.publishedSnapshot = record.savedDraft;
      record.lastPublishedBy = state.session.login;
      save(state);
      return record;
    },

    async resetPage(key: PageKey) {
      const state = load();
      const record = requireNamed(state.pages, key);
      record.publishedSnapshot = null;
      save(state);
      return record;
    },

    async listMaterials() {
      return load().materials.map((record) => ({
        id: record.id,
        title: record.draft.title,
        kind: record.draft.kind,
        status: listStatus(record),
      }));
    },

    async getMaterial(id: string) {
      return requireNamed(load().materials, id);
    },

    async createMaterial(input: { title: string; kind: ArticleDraft["kind"] }) {
      return createNamed(load, save, (state) => state.materials, input.title, (id, slug) => ({
        id,
        kind: input.kind,
        title: input.title.trim(),
        slug,
        excerpt: "",
        body: "",
        gallery: [],
        showInMenu: false,
        menuOrder: 0,
        clientName: "",
        industry: "",
      }));
    },

    async saveMaterial(id: string, draft: ArticleDraft) {
      return saveNamed(load, save, (state) => state.materials, id, draft);
    },

    async publishMaterial(id: string) {
      return publishNamed<ArticleDraft>(load, save, (state) => state.materials, id, articlePublishBlockers);
    },

    async hideMaterial(id: string) {
      const state = load();
      const record = requireNamed(state.materials, id);
      record.hidden = true;
      save(state);
      return record;
    },

    async deleteMaterial(id: string) {
      const state = load();
      const record = requireNamed(state.materials, id);
      if (record.publishedSnapshot != null) throw new AdminClientError("publish_blocked");
      state.materials = state.materials.filter((item) => item.id !== id);
      save(state);
    },

    async listAssets() {
      const state = load();
      const used = collectAssetUsage(state);
      return state.assets.map((asset): MediaListItem => ({
        ...asset,
        usedBy: used.get(asset.id) ?? [],
      }));
    },

    async deleteAsset(id: string) {
      const state = load();
      if ((collectAssetUsage(state).get(id) ?? []).length > 0) throw new AdminClientError("media_in_use");
      state.assets = state.assets.filter((asset) => asset.id !== id);
      save(state);
    },

    async listUsers() {
      return load().users;
    },

    async createUser(input: { login: string; role: AdminUser["role"]; password: string }) {
      const login = input.login.trim();
      if (login.length === 0) throw new AdminClientError("invalid_slug");
      const state = load();
      if (state.users.some((user) => user.login === login)) throw new AdminClientError("slug_taken");
      const user: AdminUser = { id: crypto.randomUUID(), login, role: input.role, disabled: false };
      state.users.push(user);
      save(state);
      return user;
    },

    async disableUser(id: string) {
      const state = load();
      const user = state.users.find((item) => item.id === id);
      if (user == null) throw new Error("not_found");
      if (user.login === state.session.login) throw new AdminClientError("cannot_disable_self");
      if (user.role === "admin" && enabledAdmins(state).length <= 1) throw new AdminClientError("last_admin");
      user.disabled = true;
      save(state);
      return user;
    },

    async setUserRole(id: string, role: AdminUser["role"]) {
      const state = load();
      const user = state.users.find((item) => item.id === id);
      if (user == null) throw new Error("not_found");
      if (user.role === "admin" && role !== "admin" && !user.disabled && enabledAdmins(state).length <= 1) {
        throw new AdminClientError("last_admin");
      }
      user.role = role;
      save(state);
      return user;
    },

    async storageNotice() {
      load();
      if (!repairedNoticePending) return null;
      repairedNoticePending = false;
      return "Хранилище повреждено, восстановлены стартовые данные";
    },
  };
}

export function browserAdminClient(): AdminClient {
  return createLocalAdminClient({
    read: () => localStorage.getItem(LOCAL_STORAGE_KEY),
    write: (value) => localStorage.setItem(LOCAL_STORAGE_KEY, value),
  });
}
