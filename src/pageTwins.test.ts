import { afterAll, describe, expect, it, vi } from "vitest";
import { PAGE_LABELS } from "./admin/domain/pageLabels";
import type { PageDraft, PageKey } from "./admin/domain/types";
import { PAGE_KEYS } from "./admin/domain/types";
import { PAGE_FORM_KEYS } from "./content/pageForm";
import { MIGRATIONS } from "./migrations";
import { PUBLIC_STUB_PAGE_KEYS, readStubPatch } from "./publishedRead";

/**
 * ponytail: pages and cms_drafts are in memory and `pg.Pool` is stubbed, so this never opens Postgres.
 * Ceiling: a write the stub does not recognize throws; an `UPDATE pages` with no key predicate rewrites every page row.
 * Upgrade path: call savePage against Postgres and SELECT the delivery row afterward.
 */
const harness = vi.hoisted(() => {
  const introducedDatabaseUri = process.env.DATABASE_URI == null;
  if (introducedDatabaseUri) process.env.DATABASE_URI = "postgres://page-twin-stub";

  type StoredSection = { id: string; heading: string; body: string };
  type StoredPage = Record<string, unknown> & {
    id: number;
    key: string;
    title: string;
    status: string;
    stub_hero_title: string;
    sections: StoredSection[];
  };

  const pages = new Map<string, StoredPage>();
  const drafts = new Map<string, unknown>();

  function pageById(id: unknown): StoredPage | undefined {
    const numeric = Number(id);
    return [...pages.values()].find((page) => page.id === numeric);
  }

  function columns(page: StoredPage): Record<string, unknown> {
    const { sections: _sections, ...row } = page;
    return row;
  }

  function updateTargetKeys(sql: string, params: unknown[]): string[] {
    const paramMatch = sql.match(/WHERE key\s*=\s*\$(\d+)/i);
    if (paramMatch) {
      const key = params[Number(paramMatch[1]) - 1];
      return typeof key === "string" ? [key] : [];
    }
    const literal = sql.match(/WHERE key\s*=\s*'([^']+)'/i);
    if (literal) return [literal[1]];
    return [...pages.keys()];
  }

  function applyPageUpdate(page: StoredPage, params: unknown[]): void {
    const texts = params.filter((value): value is string => typeof value === "string" && value !== page.key);
    page.title = texts[0] ?? "OVERWRITTEN";
    page.stub_hero_title = texts.find((text) => text.length > 0) ?? page.title;
    const body = texts.at(-1) ?? "OVERWRITTEN";
    if (page.sections.length === 0) page.sections.push({ id: "written", heading: "", body });
    else page.sections[0] = { ...page.sections[0], body };
  }

  function dispatch(sql: string, params: unknown[] = []): Record<string, unknown>[] {
    const text = sql.replace(/\s+/g, " ").trim();
    if (text === "BEGIN" || text === "COMMIT" || text === "ROLLBACK") return [];
    if (text.startsWith("SELECT * FROM pages WHERE key")) {
      const page = pages.get(String(params[0]));
      return page ? [columns(page)] : [];
    }
    if (text.includes("FROM pages") && text.includes("pages.status = 'published'")) {
      const page = pages.get(String(params[0]));
      return page?.status === "published" ? [columns(page)] : [];
    }
    if (text.includes("pages_editorial_features")) {
      if (/^(UPDATE|INSERT|DELETE)\b/i.test(text)) throw new Error(`unexpected feature write: ${text}`);
      return [];
    }
    if (text.includes("pages_editorial_sections")) {
      if (text.startsWith("SELECT")) {
        return (pageById(params[0])?.sections ?? []).map((section) => ({ ...section }));
      }
      if (text.startsWith("DELETE")) {
        const page = pageById(params[0]);
        if (page) page.sections = [];
        return [];
      }
      if (text.startsWith("INSERT")) {
        const [id, parentId, , heading, body] = params;
        const page = pageById(parentId);
        if (!page) throw new Error(`section insert for unknown parent ${String(parentId)}`);
        page.sections.push({ id: String(id), heading: String(heading ?? ""), body: String(body ?? "") });
        return [];
      }
      throw new Error(`unhandled section sql: ${text}`);
    }
    if (text.includes("cms_document_links") || text.includes("cms_image_focal_positions")) return [];
    if (text.includes("page_forms") || text.includes("page_form_fields")) return [];
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
    if (text.includes("pg_advisory_xact_lock") || text.includes("SELECT pack FROM cms_change_sets")) return [];
    if (text.includes("INSERT INTO cms_change_sets")) return [];
    if (text.includes("UPDATE pages")) {
      for (const key of updateTargetKeys(text, params)) {
        const page = pages.get(key);
        if (page) applyPageUpdate(page, params);
      }
      return [];
    }
    if (/^(UPDATE|INSERT|DELETE)\b/i.test(text)) throw new Error(`unhandled write: ${text}`);
    throw new Error(`unhandled read: ${text}`);
  }

  function storedPage(key: string, id: number, heroTitle: string, sections: StoredSection[]): StoredPage {
    return {
      id,
      key,
      title: "Доставка",
      status: "published",
      stub_hero_configured: true,
      stub_hero_eyebrow: "",
      stub_hero_title: heroTitle,
      stub_hero_lead: "",
      stub_hero_image_id: null,
      stub_hero_image_alt: "",
      seo_seo_title: "",
      seo_seo_description: "",
      editorial_configured: true,
      editorial_heading_configured: false,
      editorial_features_configured: false,
      editorial_sections_configured: true,
      editorial_notice_configured: false,
      editorial_proof_configured: false,
      editorial_cta_configured: false,
      sections,
    };
  }

  return {
    dispatch,
    restoreDatabaseUri() {
      if (introducedDatabaseUri) delete process.env.DATABASE_URI;
    },
    reset() {
      pages.clear();
      drafts.clear();
      pages.set("delivery", storedPage("delivery", 1, "Публичная доставка", [
        { id: "lead", heading: "", body: "Срок согласует менеджер." },
      ]));
      pages.set("shop-delivery", storedPage("shop-delivery", 2, "Доставка", []));
    },
    draft(collection: string, id: string) {
      return drafts.get(`${collection}:${id}`);
    },
    page(key: string) {
      const stored = pages.get(key);
      return stored ? { title: stored.title, heroTitle: stored.stub_hero_title, sections: stored.sections.map((section) => ({ ...section })) } : undefined;
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

afterAll(() => {
  harness.restoreDatabaseUri();
});

const TWIN_TITLES = [
  ["delivery", "Доставка"],
  ["payment", "Оплата"],
  ["shop-delivery", "Доставка"],
  ["shop-payment", "Оплата"],
  ["shop-warranty", "Гарантия и возврат"],
  ["shop-become-a-supplier", "Стать поставщиком"],
] as const;

function seededTitle(sql: string, key: string): string | undefined {
  return sql.match(new RegExp(`'${key}'\\s*,\\s*'([^']*)'`))?.[1];
}

describe("page twin keys", () => {
  it("publishes delivery and shop-delivery on their own stub keys and keeps the old keys", () => {
    expect(PUBLIC_STUB_PAGE_KEYS).toEqual(expect.arrayContaining(["delivery", "shop-delivery"]));
    expect(PUBLIC_STUB_PAGE_KEYS).toEqual(expect.arrayContaining([
      "delivery-geography",
      "shop-delivery-returns",
      "warranty",
      "branding",
      "become-a-supplier",
    ]));
    expect(PAGE_KEYS).toEqual(expect.arrayContaining(TWIN_TITLES.map(([key]) => key)));
    expect(PAGE_KEYS).toEqual(expect.arrayContaining([
      "delivery-geography",
      "shop-delivery-returns",
      "warranty",
      "branding",
      "become-a-supplier",
    ]));
    for (const [key, title] of TWIN_TITLES) {
      expect(PAGE_LABELS[key]).toBe(title);
    }
    expect([...PAGE_FORM_KEYS]).toEqual([
      "become-a-supplier",
      "delivery-geography",
      "branding",
      "warranty",
      "delivery",
      "shop-delivery",
      "shop-warranty",
      "shop-become-a-supplier",
    ]);
  });

  it("adds the enum values before the published rows, one row per key, with empty sections", () => {
    const enumMigration = MIGRATIONS.find((migration) => migration.version === "202610300030");
    const rowMigration = MIGRATIONS.find((migration) => migration.version === "202610300031");
    expect(enumMigration?.sql).toBeDefined();
    expect(rowMigration?.sql).toBeDefined();
    expect(MIGRATIONS.indexOf(rowMigration!)).toBe(MIGRATIONS.indexOf(enumMigration!) + 1);

    const enumSql = enumMigration!.sql.replace(/\s+/g, " ");
    expect(enumSql).not.toMatch(/\bINSERT\b/i);
    for (const [key] of TWIN_TITLES) {
      expect(enumSql).toContain(`ALTER TYPE enum_pages_key ADD VALUE IF NOT EXISTS '${key}'`);
    }

    const rowSql = rowMigration!.sql;
    expect(rowSql).not.toMatch(/INSERT INTO pages_editorial_sections/i);
    expect(rowSql).not.toContain("delivery-geography");
    expect(rowSql).not.toContain("shop-delivery-returns");
    expect(rowSql).not.toContain("/cart");
    expect(rowSql).toMatch(/WHERE NOT EXISTS/);
    expect(rowSql).toContain("'published'");
    for (const [key, title] of TWIN_TITLES) {
      expect(seededTitle(rowSql, key)).toBe(title);
    }
  });

  it("keeps a shop-delivery draft overlay off the published delivery title and body", async () => {
    harness.reset();
    const admin = createPostgresAdminClient({
      id: "admin-1",
      login: "admin",
      role: "admin",
      capabilities: [],
    });
    const key = "shop-delivery" as PageKey;
    const current = await admin.getPage(key);
    const draft = {
      ...current.savedDraft,
      id: key,
      hero: { eyebrow: "", title: "Черновик доставки магазина", lead: "" },
      sections: [{ id: "pickup", heading: "Самовывоз", body: "Самовывоз завтра." }],
      documents: [],
    } as PageDraft;

    await admin.savePage(key, draft, current.savedDraft);

    const db = {
      query: (sql: string, params?: unknown[]) => Promise.resolve(harness.dispatch(sql, params)),
    };
    await expect(readStubPatch(db, "delivery")).resolves.toMatchObject({
      hero: { title: "Публичная доставка" },
      sections: [{ body: "Срок согласует менеджер." }],
    });
    await expect(readStubPatch(db, "shop-delivery")).resolves.toMatchObject({
      hero: { title: "Доставка" },
      sections: [],
    });
    expect(harness.page("delivery")).toEqual({
      title: "Доставка",
      heroTitle: "Публичная доставка",
      sections: [{ id: "lead", heading: "", body: "Срок согласует менеджер." }],
    });
    expect(harness.draft("pages", "delivery")).toBeUndefined();
    expect(harness.draft("pages", "shop-delivery")).toMatchObject({
      hero: { title: "Черновик доставки магазина" },
      sections: [{ body: "Самовывоз завтра." }],
    });
  });

  it("maps a cart path onto payment pages only", async () => {
    const db = {
      async query(sql: string) {
        if (sql.includes("FROM pages") && sql.includes("pages.status = 'published'")) {
          return [{
            id: 9,
            stub_hero_configured: true,
            stub_hero_eyebrow: "",
            stub_hero_title: "Оплата",
            stub_hero_lead: "",
            stub_hero_image_alt: "",
            stub_hero_image_url: null,
            seo_seo_title: "",
            seo_seo_description: "",
            editorial_configured: false,
          }];
        }
        return [];
      },
    };

    const payment = await readStubPatch(db, "payment");
    const shopPayment = await readStubPatch(db, "shop-payment");
    const delivery = await readStubPatch(db, "delivery");

    expect(payment).toMatchObject({ cartPath: "/cart" });
    expect(shopPayment).toMatchObject({ cartPath: "/shop/cart" });
    expect(payment).not.toHaveProperty("cta");
    expect(shopPayment).not.toHaveProperty("cta");
    expect(JSON.stringify(payment)).not.toContain("/shop/cart");
    expect(delivery).not.toHaveProperty("cartPath");
    expect(delivery?.hero).not.toHaveProperty("cartPath");
  });
});
