import { expect, test } from "@playwright/test";

const apiBase = process.env.CART_TEST_API_URL ?? process.env.NEXT_PUBLIC_API_URL;
test.skip(!apiBase, "Set CART_TEST_API_URL to a disposable database-backed API");

function url(path: string): string {
  return new URL(path, apiBase).toString();
}

test("typed cart sessions stay independent and use opaque HttpOnly cookies", async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "One database-backed API check is enough");
  const origin = testInfo.project.use.baseURL as string;
  const headers = { origin };
  const tire = { itemType: "tire", itemId: "e2e-tire", name: "Tire E2E", quantity: 2 };
  const wheel = { itemType: "wheel", itemId: "e2e-wheel", name: "Wheel E2E", quantity: 1 };

  expect(await (await request.get(url("/v1/cart?kind=bizon"), { headers })).json())
    .toMatchObject({ ok: true, hasSession: false, items: [] });
  for (const invalid of ["/v1/cart", "/v1/cart?kind=unknown"]) {
    expect((await request.get(url(invalid), { headers })).status()).toBe(400);
    expect((await request.put(url(invalid), { headers, data: { items: [] } })).status()).toBe(400);
    expect((await request.delete(url(invalid), { headers })).status()).toBe(400);
  }

  const savedBizon = await request.put(url("/v1/cart?kind=bizon"), {
    headers, data: { items: [tire, wheel] },
  });
  expect(savedBizon.status()).toBe(200);
  const bizonCookie = savedBizon.headersArray().find((header) => header.name.toLowerCase() === "set-cookie")?.value ?? "";
  expect(bizonCookie).toContain("bizon-site-cart-session-v1=");
  expect(bizonCookie).toContain("HttpOnly");
  expect(bizonCookie).toContain("Max-Age=2592000");
  expect(bizonCookie).not.toContain("Tire E2E");

  const savedShop = await request.put(url("/v1/cart?kind=shop"), {
    headers, data: { items: [wheel, tire] },
  });
  expect(savedShop.status()).toBe(200);
  const shopCookie = savedShop.headersArray().find((header) => header.name.toLowerCase() === "set-cookie")?.value ?? "";
  expect(shopCookie).toContain("bizon-shop-cart-session-v1=");
  expect(shopCookie).toContain("HttpOnly");
  expect(shopCookie).not.toContain("Wheel E2E");
  expect(shopCookie.split(";")[0]).not.toBe(bizonCookie.split(";")[0]);

  expect(await (await request.get(url("/v1/cart?kind=bizon"), { headers })).json())
    .toMatchObject({ ok: true, hasSession: true, items: [tire] });
  expect(await (await request.get(url("/v1/cart?kind=shop"), { headers })).json())
    .toMatchObject({ ok: true, hasSession: true, items: [wheel] });

  expect((await request.put(url("/v1/cart?kind=bizon"), {
    headers: { origin: "https://forbidden.example" }, data: { items: [] },
  })).status()).toBe(403);
  expect((await request.post(url("/v1/cart/migrate"), {
    headers: { origin: "https://forbidden.example" }, data: {},
  })).status()).toBe(403);

  const cleared = await request.delete(url("/v1/cart?kind=bizon"), { headers });
  expect(cleared.status()).toBe(200);
  expect(cleared.headers()["set-cookie"]).toContain("bizon-site-cart-session-v1=");
  expect(cleared.headers()["set-cookie"]).toContain("Max-Age=0");
  expect(await (await request.get(url("/v1/cart?kind=bizon"), { headers })).json())
    .toMatchObject({ hasSession: false, items: [] });
  expect(await (await request.get(url("/v1/cart?kind=shop"), { headers })).json())
    .toMatchObject({ hasSession: true, items: [wheel] });
  await request.delete(url("/v1/cart?kind=shop"), { headers });
});

test("migration favors readable cookie lines and returns recovery lines on retry", async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "One database-backed API check is enough");
  const headers = { origin: testInfo.project.use.baseURL as string };
  const tire = { itemType: "tire", itemId: "cookie-tire", name: "Cookie Tire", quantity: 1 };
  const wheel = { itemType: "wheel", itemId: "cookie-wheel", name: "Cookie Wheel", quantity: 1 };
  const unknown = { itemType: "future", itemId: "recover", custom: { keep: true } };
  const localOnly = { itemType: "tire", itemId: "local-only", name: "Local Only", quantity: 1 };
  const existingWheel = { itemType: "wheel", itemId: "already-typed", name: "Existing Wheel", quantity: 2 };
  await request.put(url("/v1/cart?kind=shop"), { headers, data: { items: [existingWheel] } });
  const payload = {
    legacyCookieItems: [tire, wheel, unknown],
    legacyStorageItems: [localOnly],
  };
  const first = await request.post(url("/v1/cart/migrate"), { headers, data: payload });
  expect(first.status()).toBe(200);
  expect(await first.json()).toMatchObject({
    ok: true,
    bizonItems: [tire],
    shopItems: [existingWheel, wheel],
    unmappedItems: [unknown],
  });
  const cookies = first.headersArray().filter((header) => header.name.toLowerCase() === "set-cookie").map((header) => header.value);
  expect(cookies).toHaveLength(3);
  expect(cookies).toEqual(expect.arrayContaining([
    expect.stringContaining("bizon-site-cart-session-v1="),
    expect.stringContaining("bizon-shop-cart-session-v1="),
    expect.stringContaining("bizon-cart-session-v1=;"),
  ]));
  const second = await request.post(url("/v1/cart/migrate"), { headers, data: payload });
  expect(second.status()).toBe(200);
  expect(await second.json()).toMatchObject({
    bizonItems: [tire],
    shopItems: [existingWheel, wheel],
    unmappedItems: [unknown],
  });
  await request.delete(url("/v1/cart?kind=bizon"), { headers });
  await request.delete(url("/v1/cart?kind=shop"), { headers });
});
