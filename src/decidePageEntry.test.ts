import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChangeEntry, ChangeSet, PageKey, StatusEntity } from "./admin/domain/types";

/**
 * ponytail: pages, drafts, and change packs are in memory and `pg.Pool` is stubbed, so this never opens Postgres.
 * Ceiling: a write the stub does not recognize throws; BEGIN/ROLLBACK are not replayed, so a thrown decision must not have written yet.
 * Upgrade path: accept one page of a pending pack in Postgres and SELECT that page plus cms_change_sets.
 */
const harness = vi.hoisted(() => {
  const introducedDatabaseUri = process.env.DATABASE_URI == null;
  if (introducedDatabaseUri) process.env.DATABASE_URI = "postgres://decide-page-entry-stub";

  type StoredPage = Record<string, unknown> & {
    id: number;
    key: string;
    status: string;
    stub_hero_title: string;
  };

  const pages = new Map<string, StoredPage>();
  const drafts = new Map<string, unknown>();
  const packs = new Map<string, ChangeSet>();

  function storedPage(key: string, id: number, heroTitle: string): StoredPage {
    return {
      id,
      key,
      title: heroTitle,
      status: "published",
      stub_hero_configured: true,
      stub_hero_eyebrow: "",
      stub_hero_title: heroTitle,
      stub_hero_lead: "",
      stub_hero_image_id: null,
      stub_hero_image_alt: "",
      seo_seo_title: "",
      seo_seo_description: "",
      editorial_configured: false,
      editorial_heading_configured: false,
      editorial_features_configured: false,
      editorial_sections_configured: false,
      editorial_notice_configured: false,
      editorial_proof_configured: false,
      editorial_cta_configured: false,
    };
  }

  function dispatch(sql: string, params: unknown[] = []): Record<string, unknown>[] {
    const text = sql.replace(/\s+/g, " ").trim();
    if (text === "BEGIN" || text === "COMMIT" || text === "ROLLBACK") return [];
    if (text.includes("pg_advisory_xact_lock")) return [];
    if (text.startsWith("SELECT * FROM pages WHERE key")) {
      const page = pages.get(String(params[0]));
      return page ? [{ ...page }] : [];
    }
    if (text.startsWith("SELECT id FROM pages WHERE key")) {
      const page = pages.get(String(params[0]));
      return page ? [{ id: page.id }] : [];
    }
    if (text.startsWith("UPDATE pages") && text.includes("stub_hero_title")) {
      const page = pages.get(String(params[0]));
      if (page) page.stub_hero_title = String(params[4] ?? "");
      return [];
    }
    if (text.startsWith("UPDATE pages") && text.includes("editorial_configured")) return [];
    if (text.includes("pages_editorial_") || text.includes("cms_document_links") || text.includes("cms_image_focal_positions") || text.includes("page_forms") || text.includes("page_form_fields")) {
      return [];
    }
    if (text.includes("SELECT draft FROM cms_drafts")) {
      const draft = drafts.get(`${params[0]}:${params[1]}`);
      return draft === undefined ? [] : [{ draft }];
    }
    if (text.includes("INSERT INTO cms_drafts")) {
      drafts.set(`${params[0]}:${params[1]}`, JSON.parse(String(params[2])));
      return [];
    }
    if (text.includes("DELETE FROM cms_drafts")) {
      drafts.delete(`${params[0]}:${params[1]}`);
      return [];
    }
    if (text.includes("SELECT pack FROM cms_change_sets WHERE id")) {
      const pack = packs.get(String(params[0]));
      return pack ? [{ pack: structuredClone(pack) }] : [];
    }
    if (text.includes("SELECT pack FROM cms_change_sets")) {
      return [...packs.values()].map((pack) => ({ pack: structuredClone(pack) }));
    }
    if (text.includes("INSERT INTO cms_change_sets")) {
      const pack = JSON.parse(String(params[1])) as ChangeSet;
      packs.set(pack.id, pack);
      return [];
    }
    if (/^(UPDATE|INSERT|DELETE)\b/i.test(text)) throw new Error(`unhandled write: ${text}`);
    throw new Error(`unhandled read: ${text}`);
  }

  return {
    dispatch,
    restoreDatabaseUri() {
      if (introducedDatabaseUri) delete process.env.DATABASE_URI;
    },
    reset() {
      pages.clear();
      drafts.clear();
      packs.clear();
      pages.set("delivery", storedPage("delivery", 1, "Публичная доставка"));
      pages.set("shop-delivery", storedPage("shop-delivery", 2, "Публичная доставка магазина"));
      pages.set("payment", storedPage("payment", 3, "Публичная оплата"));
    },
    draft(collection: string, id: string) {
      return drafts.get(`${collection}:${id}`);
    },
    saveDraft(id: string, title: string) {
      drafts.set(`pages:${id}`, {
        id,
        seoTitle: "",
        seoDescription: "",
        hero: { eyebrow: "", title, lead: "" },
        documents: [],
      });
    },
    page(key: string) {
      const stored = pages.get(key);
      return stored ? { heroTitle: stored.stub_hero_title } : undefined;
    },
    savePack(pack: ChangeSet) {
      packs.set(pack.id, structuredClone(pack));
    },
    pack(id: string) {
      const stored = packs.get(id);
      return stored ? structuredClone(stored) : undefined;
    },
  };
});

vi.mock("pg", () => ({
  Pool: class {
    query(sql: string, params?: unknown[]) {
      return Promise.resolve({ rows: harness.dispatch(sql, params) });
    }

    connect() {
      return Promise.resolve({
        query: (sql: string, params?: unknown[]) => this.query(sql, params),
        release() {},
      });
    }
  },
}));

import { createPostgresAdminClient } from "./admin/server/postgresAdmin";
import { isSiteAffectingPublicationMethod } from "./deploy/timewebApps";

afterAll(() => {
  harness.restoreDatabaseUri();
});

beforeEach(() => {
  harness.reset();
});

const adminAccount = {
  id: "admin-1",
  login: "admin",
  role: "admin" as const,
  capabilities: [],
};

function changeEntry(id: string, entityType: StatusEntity, entityId: string): ChangeEntry {
  return {
    id,
    entityType,
    entityId,
    entityTitle: entityId,
    operation: "update",
    fieldChanges: [],
    rollbackDraft: null,
  };
}

function changePack(id: string, status: ChangeSet["status"], entries: ChangeEntry[]): ChangeSet {
  return {
    id,
    authorUserId: "editor-1",
    authorLogin: "editor",
    status,
    createdAt: "2026-10-30T00:00:00.000Z",
    updatedAt: "2026-10-30T00:00:00.000Z",
    submittedAt: status === "pending_review" ? "2026-10-30T00:00:00.000Z" : null,
    reviewedAt: null,
    reviewedByLogin: null,
    reviewComment: null,
    entries,
  };
}

describe("decidePageEntry", () => {
  it("counts a page decision as a public site rebuild, same as publishPage", () => {
    expect(isSiteAffectingPublicationMethod("decidePageEntry")).toBe(true);
    expect(isSiteAffectingPublicationMethod("publishPage")).toBe(true);
  });

  it("accepts one page and rejects the other without publishing the rejected draft", async () => {
    harness.saveDraft("delivery", "Черновик доставки");
    harness.saveDraft("shop-delivery", "Черновик доставки магазина");
    harness.savePack(changePack("pack-pages", "pending_review", [
      changeEntry("delivery-entry", "page", "delivery"),
      changeEntry("shop-entry", "page", "shop-delivery"),
    ]));
    const admin = createPostgresAdminClient(adminAccount);

    const accepted = await admin.decidePageEntry("pack-pages", "delivery-entry", "accept");

    expect(accepted.status).toBe("pending_review");
    expect(accepted.entries.map((entry) => entry.entityId)).toEqual(["shop-delivery"]);
    expect(harness.pack("pack-pages")?.status).toBe("pending_review");
    expect(harness.pack("pack-pages")?.entries.map((entry) => entry.entityId)).toEqual(["shop-delivery"]);
    expect(harness.page("delivery")?.heroTitle).toBe("Черновик доставки");
    expect(harness.draft("pages", "delivery")).toBeUndefined();
    expect(harness.page("shop-delivery")?.heroTitle).toBe("Публичная доставка магазина");
    expect(harness.draft("pages", "shop-delivery")).toMatchObject({ hero: { title: "Черновик доставки магазина" } });
    await expect(admin.getPage("delivery" as PageKey)).resolves.toMatchObject({
      publishedSnapshot: { hero: { title: "Черновик доставки" } },
    });

    const rejected = await admin.decidePageEntry("pack-pages", "shop-entry", "reject");

    expect(rejected.status).toBe("cancelled");
    expect(rejected.entries).toEqual([]);
    expect(harness.pack("pack-pages")).toMatchObject({ status: "cancelled", entries: [] });
    expect(harness.page("delivery")?.heroTitle).toBe("Черновик доставки");
    expect(harness.draft("pages", "delivery")).toBeUndefined();
    expect(harness.page("shop-delivery")?.heroTitle).toBe("Публичная доставка магазина");
    expect(harness.draft("pages", "shop-delivery")).toBeUndefined();
    await expect(admin.getPage("shop-delivery")).resolves.toMatchObject({
      publishedSnapshot: { hero: { title: "Публичная доставка магазина" } },
    });
  });

  it("publishes the pack when the accepted page was the last entry", async () => {
    harness.saveDraft("payment", "Черновик оплаты");
    harness.savePack(changePack("pack-payment", "pending_review", [
      changeEntry("payment-entry", "page", "payment"),
    ]));
    const admin = createPostgresAdminClient(adminAccount);

    const accepted = await admin.decidePageEntry("pack-payment", "payment-entry", "accept");

    expect(accepted.status).toBe("published");
    expect(accepted.entries).toEqual([]);
    expect(harness.pack("pack-payment")).toMatchObject({ status: "published", entries: [] });
    expect(harness.page("payment")?.heroTitle).toBe("Черновик оплаты");
    expect(harness.draft("pages", "payment")).toBeUndefined();
  });

  it("leaves a tire-model entry in the pack and refuses to decide that entry", async () => {
    harness.saveDraft("delivery", "Черновик доставки");
    harness.savePack(changePack("pack-mixed", "pending_review", [
      changeEntry("delivery-entry", "page", "delivery"),
      changeEntry("home-entry", "page", "home"),
      changeEntry("about-entry", "page", "about"),
      changeEntry("tire-entry", "tire-model", "model-9"),
    ]));
    const admin = createPostgresAdminClient(adminAccount);

    await expect(admin.decidePageEntry("pack-mixed", "home-entry", "accept")).rejects.toMatchObject({ code: "publish_blocked" });
    await expect(admin.decidePageEntry("pack-mixed", "about-entry", "reject")).rejects.toMatchObject({ code: "publish_blocked" });
    await expect(admin.decidePageEntry("pack-mixed", "tire-entry", "accept")).rejects.toMatchObject({ code: "publish_blocked" });
    expect(harness.page("delivery")?.heroTitle).toBe("Публичная доставка");
    expect(harness.draft("pages", "delivery")).toMatchObject({ hero: { title: "Черновик доставки" } });
    expect(harness.pack("pack-mixed")?.entries.map((entry) => entry.entityId)).toEqual(["delivery", "home", "about", "model-9"]);

    const accepted = await admin.decidePageEntry("pack-mixed", "delivery-entry", "accept");

    expect(accepted.status).toBe("pending_review");
    expect(accepted.entries.map((entry) => entry.entityId)).toEqual(["home", "about", "model-9"]);
    expect(harness.page("delivery")?.heroTitle).toBe("Черновик доставки");
    expect(harness.draft("pages", "delivery")).toBeUndefined();
    await expect(admin.decidePageEntry("pack-mixed", "tire-entry", "accept")).rejects.toMatchObject({ code: "publish_blocked" });
    expect(harness.pack("pack-mixed")?.status).toBe("pending_review");
    expect(harness.pack("pack-mixed")?.entries.map((entry) => entry.entityId)).toEqual(["home", "about", "model-9"]);
    expect(harness.page("delivery")?.heroTitle).toBe("Черновик доставки");
  });

  it("refuses a pack that is not pending review and leaves the draft in place", async () => {
    harness.saveDraft("delivery", "Черновик доставки");
    harness.savePack(changePack("pack-open", "open", [
      changeEntry("delivery-entry", "page", "delivery"),
    ]));
    const admin = createPostgresAdminClient(adminAccount);

    await expect(admin.decidePageEntry("pack-open", "delivery-entry", "accept")).rejects.toMatchObject({
      code: "changeset_not_pending",
    });
    expect(harness.page("delivery")?.heroTitle).toBe("Публичная доставка");
    expect(harness.draft("pages", "delivery")).toMatchObject({ hero: { title: "Черновик доставки" } });
    expect(harness.pack("pack-open")?.status).toBe("open");
  });
});
