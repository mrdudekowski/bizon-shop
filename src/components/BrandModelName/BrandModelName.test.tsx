// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import { BrandModelName } from "./BrandModelName";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("BrandModelName", () => {
  let host: HTMLDivElement;
  let root: Root;

  async function renderName(name: string) {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root.render(createElement(BrandModelName, { name }));
    });
  }

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
    });
    host?.remove();
  });

  it("splits the BIZON brand and model into inline elements", async () => {
    await renderName("BIZON DSR158");

    const brand = host.querySelector("[data-brand]");
    const model = host.querySelector("[data-model]");
    expect(brand?.textContent).toBe("BIZON");
    expect(model?.textContent).toBe("DSR158");
    expect(host.textContent).toBe("BIZON DSR158");
  });

  it("matches the brand prefix without case sensitivity", async () => {
    await renderName("bizon Atlas");

    const brand = host.querySelector("[data-brand]");
    const model = host.querySelector("[data-model]");
    expect(brand?.textContent).toBe("BIZON");
    expect(model?.textContent).toBe("Atlas");
  });

  it("preserves the full model suffix including spaces", async () => {
    await renderName("BIZON DSR 158 R22.5");

    expect(host.querySelector("[data-model]")?.textContent).toBe("DSR 158 R22.5");
    expect(host.textContent).toBe("BIZON DSR 158 R22.5");
  });

  it("renders a name without the BIZON prefix unchanged", async () => {
    await renderName("Atlas Sport");

    expect(host.textContent).toBe("Atlas Sport");
    expect(host.querySelector("[data-brand]")).toBeNull();
  });
});
