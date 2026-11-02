// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

describe("TireCatalog model card at phone width", () => {
  afterEach(() => {
    document.head.replaceChildren();
    document.body.replaceChildren();
  });

  it("does not show a hidden model card when the phone grid is active", () => {
    const css = readFileSync(join(process.cwd(), "src/components/catalog/TireCatalog.module.css"), "utf8")
      .replace(/:global\(([^)]+)\)/g, "$1");
    const viewport = window as unknown as { happyDOM: { setViewport: (size: { width: number; height: number }) => void } };
    viewport.happyDOM.setViewport({ width: 390, height: 844 });
    document.head.append(Object.assign(document.createElement("style"), { textContent: css }));

    const visible = document.createElement("article");
    visible.className = "modelCard";
    const hidden = document.createElement("article");
    hidden.className = "modelCard";
    hidden.hidden = true;
    document.body.append(visible, hidden);

    expect(window.innerWidth).toBe(390);
    expect(getComputedStyle(visible).display).toBe("grid");
    expect(getComputedStyle(hidden).display).toBe("none");
  });
});
