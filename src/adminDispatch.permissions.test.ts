import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => {
  const query = vi.fn(async () => ({ rows: [] }));
  const release = vi.fn();
  const client = { query, release };
  return {
    query,
    release,
    connect: vi.fn(async () => client),
  };
});

vi.mock("pg", () => ({
  Pool: vi.fn(function PoolMock() {
    return { connect: database.connect, query: database.query };
  }),
}));

import { dispatchAdminCall } from "./adminDispatch";
import type { AuthenticatedAccount } from "./admin/server/adminAuth";

const basicEditor: AuthenticatedAccount = {
  id: "editor-1",
  login: "editor@example.test",
  role: "editor",
  capabilities: [],
};

beforeEach(() => {
  vi.stubEnv("DATABASE_URI", "postgres://permission-test.invalid/db");
  database.query.mockClear();
  database.release.mockClear();
  database.connect.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("admin operation permissions", () => {
  it.each([
    ["createTireDirection", [{ name: "Denied test" }]],
    ["createWheelType", [{ name: "Denied test" }]],
    ["createShopCategory", [{ name: "Denied test" }]],
    ["createShopSubcategory", [{ categoryId: "1", name: "Denied test", slug: "denied-test" }]],
    ["saveShopSubcategory", ["1", { name: "Denied test", slug: "denied-test" }]],
    ["createTireModel", [{ name: "Denied test", directionId: "1" }]],
    ["createWheelModel", [{ name: "Denied test", wheelTypeId: "1" }]],
    ["createShopProduct", [{ name: "Denied test", categoryId: "1" }]],
    ["publishTireDirection", ["1"]],
    ["publishTireModel", ["1"]],
    ["publishWheelType", ["1"]],
    ["publishWheelModel", ["1"]],
    ["publishShopCategory", ["1"]],
    ["publishShopProduct", ["1"]],
    ["publishPage", ["home"]],
    ["resetPage", ["home"]],
    ["publishMaterial", ["article-1"]],
    ["hideTireDirection", ["1"]],
    ["hideTireModel", ["1"]],
    ["hideWheelType", ["1"]],
    ["hideWheelModel", ["1"]],
    ["hideShopCategory", ["1"]],
    ["hideShopProduct", ["1"]],
    ["hideMaterial", ["article-1"]],
    ["deleteTireDirection", ["1"]],
    ["deleteTireModel", ["1"]],
    ["deleteWheelType", ["1"]],
    ["deleteWheelModel", ["1"]],
    ["deleteShopCategory", ["1"]],
    ["deleteShopSubcategory", ["1"]],
    ["deleteShopProduct", ["1"]],
    ["deleteAsset", ["1"]],
    ["deleteMaterial", ["article-1"]],
    ["savePage", ["home", {}]],
    ["createMaterial", [{ title: "Denied test", kind: "article" }]],
    ["saveMaterial", ["article-1", {}]],
    ["publishChangeSet", ["test-pack"]],
    ["returnChangeSet", ["test-pack", "Not allowed"]],
    ["cancelChangeSet", ["test-pack"]],
    ["listUsers", []],
    ["listPasswordResetHistory", []],
    ["createUser", [{ login: "denied@example.test", role: "editor", password: "not-used" }]],
    ["disableUser", ["5"]],
    ["setUserRole", ["5", "admin"]],
    ["resetUserPassword", ["5", "a-new-long-password"]],
    ["setUserCapabilities", ["5", ["create_catalog_items"]]],
  ])("denies editor call to %s before any application data query", async (method, args) => {
    const response = await dispatchAdminCall({ method, args }, basicEditor);

    expect(response).toEqual({ status: 403, body: { ok: false, code: "forbidden" } });
    expect(database.query.mock.calls.every(([sql]) => sql === "BEGIN" || sql === "ROLLBACK")).toBe(true);
  });

  it("denies a page editor who does not have catalog creation rights", async () => {
    const response = await dispatchAdminCall(
      { method: "createTireModel", args: [{ name: "Denied test", directionId: "1" }] },
      { ...basicEditor, capabilities: ["edit_site_pages"] },
    );

    expect(response).toEqual({ status: 403, body: { ok: false, code: "forbidden" } });
    expect(database.query.mock.calls.every(([sql]) => sql === "BEGIN" || sql === "ROLLBACK")).toBe(true);
  });

  it("denies a catalog creator who does not have page editing rights", async () => {
    const response = await dispatchAdminCall(
      { method: "savePage", args: ["home", {}] },
      { ...basicEditor, capabilities: ["create_catalog_items"] },
    );

    expect(response).toEqual({ status: 403, body: { ok: false, code: "forbidden" } });
    expect(database.query.mock.calls.every(([sql]) => sql === "BEGIN" || sql === "ROLLBACK")).toBe(true);
  });
});
