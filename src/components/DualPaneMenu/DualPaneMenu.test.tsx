// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    createElement("a", { href, ...props }, children),
}));
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => createElement("img", props),
}));

import { DualPaneMenu } from "./DualPaneMenu";

const menu = {
  defaultSectionId: "models",
  sections: [
    {
      id: "models",
      label: "Модели",
      pane: "list" as const,
      items: [{ id: "dsr158", title: "DSR158", href: "/models/dsr158" }],
    },
  ],
};

describe("DualPaneMenu focus transfer", () => {
  let host: HTMLDivElement;
  let root: Root;

  afterEach(async () => {
    await act(async () => root?.unmount());
    host?.remove();
    vi.restoreAllMocks();
  });

  it("moves focus from the selected section into its newly active pane", async () => {
    vi.spyOn(HTMLElement.prototype, "getClientRects").mockImplementation(function getClientRects() {
      if (this.closest("[inert], [hidden]") || this.closest('[aria-hidden="true"]')) {
        return [] as unknown as DOMRectList;
      }
      return [new DOMRect(0, 0, 1, 1)] as unknown as DOMRectList;
    });
    window.matchMedia = vi.fn((query: string) => ({
      media: query,
      matches: query === "(max-width: 767px)" || query === "(max-width: 768px)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;

    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    const props = { onClose: vi.fn(), menu, context: "main" as const };

    await act(async () => root.render(createElement(DualPaneMenu, { ...props, isOpen: false })));
    await act(async () => root.render(createElement(DualPaneMenu, { ...props, isOpen: true })));
    const section = host.querySelector<HTMLButtonElement>('button[aria-controls]');
    expect(section?.textContent).toContain("Модели");

    await act(async () => {
      section?.focus();
      section?.click();
    });
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));

    const activePane = section?.getAttribute("aria-controls")
      ? document.getElementById(section.getAttribute("aria-controls") as string)
      : null;
    expect(host.querySelector("#burger-menu")?.getAttribute("data-mobile-view")).toBe("pane");
    expect(activePane?.contains(document.activeElement)).toBe(true);
    expect(document.activeElement?.textContent).toContain("Назад");
    expect(document.activeElement?.closest("[inert]")).toBeNull();
  });
});
