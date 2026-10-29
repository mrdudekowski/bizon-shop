import { canvasPaintMode, type CanvasPaintMode } from "./canvasPaintMode";

const FROM = "rgb(10, 10, 10)";
const TO = "rgb(255, 255, 255)";

export function detectCanvasPaintMode(): Promise<CanvasPaintMode> {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return Promise.resolve("static");

  const parent = document.createElement("div");
  const child = document.createElement("div");
  parent.style.cssText = "position:fixed;left:0;top:0;width:4px;height:4px;opacity:0;pointer-events:none;--probe-canvas:#0a0a0a";
  child.style.cssText = "width:4px;height:4px;background-color:var(--probe-canvas);transition:background-color 480ms linear";
  parent.append(child);
  document.documentElement.append(parent);
  getComputedStyle(child).backgroundColor;
  parent.style.setProperty("--probe-canvas", "#ffffff");

  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const sampled = getComputedStyle(child).backgroundColor;
        parent.remove();
        resolve(canvasPaintMode(sampled, FROM, TO));
      });
    });
  });
}
