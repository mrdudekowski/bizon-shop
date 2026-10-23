import type { PoolClient } from "pg";
import { describe, expect, it, vi } from "vitest";
import { replaceDocumentLinks } from "./postgresAdmin";

function database(media: Array<{ id: number; mime_type: string }>) {
  let links = [99];
  const query = vi.fn(async (sql: string, params: unknown[] = []) => {
    if (sql.startsWith("SELECT")) {
      const ids = params[0] as number[];
      return { rows: media.filter((row) => ids.includes(row.id)) };
    }
    if (sql.startsWith("DELETE")) links = [];
    if (sql.startsWith("INSERT")) {
      const id = params[2] as number;
      if (links.includes(id)) throw new Error("duplicate media link");
      links.push(id);
    }
    return { rows: [] };
  });
  return { client: { query } as unknown as PoolClient, query, links: () => links };
}

describe("replaceDocumentLinks", () => {
  it.each([
    ["an image", "7", [{ id: 7, mime_type: "image/png" }]],
    ["an unknown media ID", "7", []],
    ["a nonnumeric ID", "unknown", []],
    ["an unsafe integer", "9007199254740993", []],
    ["an out-of-range PostgreSQL integer", "2147483648", []],
  ])("rejects %s before deleting existing links", async (_label, assetId, media) => {
    const db = database(media);
    await expect(replaceDocumentLinks("page", "privacy-policy", [{ assetId, title: "Policy" }], db.client))
      .rejects.toMatchObject({ code: "publish_blocked" });
    expect(db.links()).toEqual([99]);
    expect(db.query.mock.calls.some(([sql]) => sql.startsWith("DELETE"))).toBe(false);
  });

  it("rejects duplicate IDs before deleting existing links, including equivalent numeric forms", async () => {
    const db = database([{ id: 7, mime_type: "application/pdf" }]);
    await expect(replaceDocumentLinks("tire-model", "12", [
      { assetId: "7", title: "First" }, { assetId: "007", title: "Second" },
    ], db.client)).rejects.toMatchObject({ code: "publish_blocked" });
    expect(db.links()).toEqual([99]);
  });

  it("validates every document before deleting when a later document is invalid", async () => {
    const db = database([{ id: 7, mime_type: "application/pdf" }, { id: 8, mime_type: "image/jpeg" }]);
    await expect(replaceDocumentLinks("wheel-model", "12", [
      { assetId: "7", title: "PDF" }, { assetId: "8", title: "Image" },
    ], db.client)).rejects.toMatchObject({ code: "publish_blocked" });
    expect(db.links()).toEqual([99]);
  });

  it("writes verified PDFs in submitted order with their titles", async () => {
    const db = database([{ id: 7, mime_type: "application/pdf" }, { id: 8, mime_type: "application/pdf" }]);
    await replaceDocumentLinks("wheel-model", "12", [
      { assetId: "8", title: "Specification" }, { assetId: "7", title: "Certificate" },
    ], db.client);
    expect(db.links()).toEqual([8, 7]);
    expect(db.query.mock.calls.filter(([sql]) => sql.startsWith("INSERT")).map(([, params]) => params))
      .toEqual([["wheel-model", "12", 8, "Specification", 0], ["wheel-model", "12", 7, "Certificate", 1]]);
    expect(db.query.mock.calls[0][0]).toContain("SELECT");
  });

  it("allows clearing all document links", async () => {
    const db = database([]);
    await replaceDocumentLinks("page", "privacy-policy", [], db.client);
    expect(db.links()).toEqual([]);
    expect(db.query).toHaveBeenCalledTimes(1);
  });
});
