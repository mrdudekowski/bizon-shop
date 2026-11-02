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

import DeliveryGeographyPage from "./page";

describe("delivery-geography page", () => {
  it("redirects to /delivery without loading page content", () => {
    expect(() => DeliveryGeographyPage()).toThrow("REDIRECT:/delivery");
    expect(redirect).toHaveBeenCalledWith("/delivery");
    expect(getPublishedStubOverlay).not.toHaveBeenCalled();
  });
});
