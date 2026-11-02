// @vitest-environment happy-dom
import { act, createElement, type ComponentProps, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import { ResponsiveDisclosure } from "./ResponsiveDisclosure";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const PHONE_QUERY = "(max-width: 767px)";

function installPhoneMedia(phone: boolean) {
  let isPhone = phone;
  const listeners = new Set<(event: { matches: boolean }) => void>();
  window.matchMedia = ((query: string) => {
    const tracked = query === PHONE_QUERY;
    return {
      media: query,
      get matches() {
        return tracked ? isPhone : false;
      },
      addEventListener(type: string, listener: (event: { matches: boolean }) => void) {
        if (type === "change" && tracked) listeners.add(listener);
      },
      removeEventListener(type: string, listener: (event: { matches: boolean }) => void) {
        if (type === "change") listeners.delete(listener);
      },
    };
  }) as typeof window.matchMedia;

  return {
    cross(nextPhone: boolean) {
      isPhone = nextPhone;
      for (const listener of listeners) listener({ matches: isPhone });
    },
  };
}

describe("ResponsiveDisclosure", () => {
  let host: HTMLDivElement;
  let root: Root;

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
    });
    host?.remove();
  });

  async function renderDisclosure(phone: boolean, children: ReactNode = createElement("a", { href: "/models" }, "Каталог")) {
    const media = installPhoneMedia(phone);
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root.render(
        createElement(ResponsiveDisclosure, { summary: "Компания" } as ComponentProps<typeof ResponsiveDisclosure>, children),
      );
    });
    const details = host.querySelector("details");
    if (!details) throw new Error("details missing");
    return { details, media };
  }

  it("loads closed at a phone width", async () => {
    const { details } = await renderDisclosure(true);
    expect(details.open).toBe(false);
  });

  it("opens when the viewport crosses 768 px upward and closes when it crosses back", async () => {
    const { details, media } = await renderDisclosure(true);
    expect(details.open).toBe(false);

    await act(async () => {
      media.cross(false);
    });
    expect(details.open).toBe(true);

    await act(async () => {
      media.cross(true);
    });
    expect(details.open).toBe(false);
  });
});
