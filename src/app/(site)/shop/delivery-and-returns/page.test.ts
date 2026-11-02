import { describe, expect, it, vi } from "vitest";

const redirect = vi.hoisted(() => vi.fn());
const getPublishedStubOverlay = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  redirect: (href: string) => {
    redirect(href);
    throw new Error(`REDIRECT:${href}`);
  },
}));
vi.mock("@/lib/content/getPageContent", () => ({ getPublishedStubOverlay }));

import DeliveryAndReturnsPage from "./page";

describe("shop delivery-and-returns page", () => {
  it("redirects to /shop/delivery without loading page content", () => {
    expect(() => DeliveryAndReturnsPage()).toThrow("REDIRECT:/shop/delivery");
    expect(redirect).toHaveBeenCalledWith("/shop/delivery");
    expect(getPublishedStubOverlay).not.toHaveBeenCalled();
  });
});
