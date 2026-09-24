import type { AnalyticsEventName, AnalyticsEventParams } from "./events";

declare global {
  interface Window {
    ym?: (counterId: number, method: string, ...args: unknown[]) => void;
  }
}

export function parseMetrikaCounterId(raw?: string | null): number | null {
  const value = raw?.trim();
  if (!value || !/^\d+$/.test(value)) return null;
  const id = Number.parseInt(value, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function getMetrikaCounterId(): number | null {
  return parseMetrikaCounterId(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID);
}

export function isMetrikaEnabled(): boolean {
  return getMetrikaCounterId() !== null;
}

export function trackEvent(
  event: AnalyticsEventName,
  params?: AnalyticsEventParams,
): void {
  if (typeof window === "undefined") return;

  const counterId = getMetrikaCounterId();
  if (!counterId || typeof window.ym !== "function") return;

  if (params && Object.keys(params).length > 0) {
    window.ym(counterId, "reachGoal", event, params);
    return;
  }

  window.ym(counterId, "reachGoal", event);
}

/** @internal test hook */
export function trackEventWithCounter(
  counterId: number | null,
  event: AnalyticsEventName,
  params?: AnalyticsEventParams,
  ymFn?: Window["ym"],
): void {
  if (!counterId || typeof ymFn !== "function") return;
  if (params && Object.keys(params).length > 0) {
    ymFn(counterId, "reachGoal", event, params);
    return;
  }
  ymFn(counterId, "reachGoal", event);
}
