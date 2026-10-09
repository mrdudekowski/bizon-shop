import { describe, expect, it, vi } from "vitest";
import { hasMediaReference, unlinkMediaReferences, unlinkStoredMediaReferences, removePendingMediaReplacement } from "./mediaReferences";

describe("CMS media references", () => {
  it("finds nested string and numeric asset ids in drafts and change sets", () => {
    expect(hasMediaReference({ gallery: [{ assetId: "42" }] }, "42")).toBe(true);
    expect(hasMediaReference({ pack: { entries: [{ value: { featuredImageId: 42 } }] } }, "42")).toBe(true);
  });

  it("does not treat unrelated record ids or text as media references", () => {
    expect(hasMediaReference({ id: "42", title: "assetId 42" }, "42")).toBe(false);
  });

  it("unlinks matching references recursively while preserving the rest of a draft", () => {
    const draft = {
      hero: { imageAssetId: "42", alt: "Summer" },
      gallery: [{ media_id: 42 }, { mediaId: "7" }],
      unrelated: { id: "42", title: "assetId 42" },
    };

    expect(unlinkMediaReferences(draft, "42")).toEqual({
      hero: { imageAssetId: null, alt: "Summer" },
      gallery: [{ media_id: null }, { mediaId: "7" }],
      unrelated: { id: "42", title: "assetId 42" },
    });
    expect(hasMediaReference(unlinkMediaReferences(draft, "42"), "42")).toBe(false);
  });

  it("clears relational references and rewrites matching drafts and change sets", async () => {
    const calls: [string, unknown[]][] = [];
    const query = async (sql: string, params: unknown[] = []) => {
      calls.push([sql, params]);
      if (sql === "SELECT collection, doc_id, draft FROM cms_drafts FOR UPDATE") {
        return [{ collection: "pages", doc_id: "home", draft: { hero: { assetId: "42" } } }];
      }
      if (sql === "SELECT id, pack FROM cms_change_sets FOR UPDATE") {
        return [{ id: "change-1", pack: { entries: [{ value: { featuredImageId: 42 } }] } }];
      }
      return [];
    };

    await unlinkStoredMediaReferences(query, "42");

    expect(calls).toContainEqual(["UPDATE pages SET home_hero_image_id = NULL WHERE home_hero_image_id = $1", [42]]);
    expect(calls).toContainEqual(["DELETE FROM products_rels WHERE media_id = $1", [42]]);
    expect(calls).toContainEqual([
      "UPDATE cms_drafts SET draft = $3::jsonb WHERE collection = $1 AND doc_id = $2",
      ["pages", "home", JSON.stringify({ hero: { assetId: null } })],
    ]);
    expect(calls).toContainEqual([
      "UPDATE cms_change_sets SET pack = $2::jsonb WHERE id = $1",
      ["change-1", JSON.stringify({ entries: [{ value: { featuredImageId: null } }] })],
    ]);
  });

  it("cancels a staged replacement transactionally and deletes its object after commit", async () => {
    const calls: [string, unknown[]][] = [];
    const afterCommit: (() => Promise<void>)[] = [];
    const deleteObject = vi.fn().mockResolvedValue(undefined);
    const query = async (sql: string, params: unknown[] = []) => {
      calls.push([sql, params]);
      if (sql.includes("SELECT staged.id, staged.object_key")) return [{ id: 43, object_key: "bizon/media/replacement.jpg" }];
      return [];
    };

    await removePendingMediaReplacement(query, "42", (callback) => afterCommit.push(callback), deleteObject);

    expect(calls).toContainEqual(["DELETE FROM cms_media_replacements WHERE target_media_id = $1", [42]]);
    expect(calls).toContainEqual(["DELETE FROM media WHERE id = $1", [43]]);
    expect(calls.some(([sql]) => sql.includes("media_replacement_cancelled_by_delete"))).toBe(true);
    expect(deleteObject).not.toHaveBeenCalled();
    await afterCommit[0]!();
    expect(deleteObject).toHaveBeenCalledWith("bizon/media/replacement.jpg");
  });
});
