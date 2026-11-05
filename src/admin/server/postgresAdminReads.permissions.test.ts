import { describe, expect, it } from "vitest";

import { PAGE_KEYS } from "../domain/types";
import type { AdminRole } from "../domain/types";
import { createPostgresAdminClient } from "./postgresAdmin";

const deniedRoles: AdminRole[] = ["viewer", "sales_manager"];

describe.each(deniedRoles)("draft reads for %s", (role) => {
  const client = createPostgresAdminClient({ id: "1", login: role, role, capabilities: [] });

  it("rejects catalog, page, and media reads before the database", async () => {
    await expect(client.listTireDirections()).rejects.toMatchObject({ code: "forbidden" });
    await expect(client.getTireDirection("1")).rejects.toMatchObject({ code: "forbidden" });
    await expect(client.listTireModels()).rejects.toMatchObject({ code: "forbidden" });
    await expect(client.getTireModel("1")).rejects.toMatchObject({ code: "forbidden" });
    await expect(client.listWheelTypes()).rejects.toMatchObject({ code: "forbidden" });
    await expect(client.getWheelType("1")).rejects.toMatchObject({ code: "forbidden" });
    await expect(client.listWheelModels()).rejects.toMatchObject({ code: "forbidden" });
    await expect(client.getWheelModel("1")).rejects.toMatchObject({ code: "forbidden" });
    await expect(client.listShopCategories()).rejects.toMatchObject({ code: "forbidden" });
    await expect(client.getShopCategory("1")).rejects.toMatchObject({ code: "forbidden" });
    await expect(client.listShopSubcategories("1")).rejects.toMatchObject({ code: "forbidden" });
    await expect(client.listShopProducts()).rejects.toMatchObject({ code: "forbidden" });
    await expect(client.getShopProduct("1")).rejects.toMatchObject({ code: "forbidden" });
    await expect(client.listPages()).rejects.toMatchObject({ code: "forbidden" });
    await expect(client.getPage(PAGE_KEYS[0])).rejects.toMatchObject({ code: "forbidden" });
    await expect(client.listMaterials()).rejects.toMatchObject({ code: "forbidden" });
    await expect(client.getMaterial("article-1")).rejects.toMatchObject({ code: "forbidden" });
    await expect(client.listAssets()).rejects.toMatchObject({ code: "forbidden" });
  });
});

describe("draft reads for an editor", () => {
  const client = createPostgresAdminClient({ id: "2", login: "editor", role: "editor", capabilities: [] });

  it("rejects page and material drafts when the editor cannot edit pages", async () => {
    await expect(client.listPages()).rejects.toMatchObject({ code: "forbidden" });
    await expect(client.getPage(PAGE_KEYS[0])).rejects.toMatchObject({ code: "forbidden" });
    await expect(client.listMaterials()).rejects.toMatchObject({ code: "forbidden" });
    await expect(client.getMaterial("article-1")).rejects.toMatchObject({ code: "forbidden" });
  });
});
