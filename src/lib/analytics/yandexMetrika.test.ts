import { describe, expect, it, vi } from "vitest";

import { ANALYTICS_EVENTS } from "./events";
import {
  getMetrikaCounterId,
  isMetrikaEnabled,
  parseMetrikaCounterId,
  trackEventWithCounter,
} from "./yandexMetrika";

describe("parseMetrikaCounterId", () => {
  it("accepts numeric ids", () => {
    expect(parseMetrikaCounterId("12345678")).toBe(12345678);
  });

  it("rejects invalid ids", () => {
    expect(parseMetrikaCounterId("")).toBeNull();
    expect(parseMetrikaCounterId("abc")).toBeNull();
    expect(parseMetrikaCounterId("12a3")).toBeNull();
  });
});

describe("isMetrikaEnabled", () => {
  it("is false without env", () => {
    const prev = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;
    delete process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;
    expect(isMetrikaEnabled()).toBe(false);
    if (prev) process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID = prev;
  });

  it("reads counter from env", () => {
    process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID = "999";
    expect(getMetrikaCounterId()).toBe(999);
    delete process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;
  });
});

describe("trackEventWithCounter", () => {
  it("calls ym reachGoal when configured", () => {
    const ym = vi.fn();
    trackEventWithCounter(42, ANALYTICS_EVENTS.addToCart, { itemType: "shopProduct" }, ym);
    expect(ym).toHaveBeenCalledWith(
      42,
      "reachGoal",
      ANALYTICS_EVENTS.addToCart,
      { itemType: "shopProduct" },
    );
  });

  it("no-ops without counter or ym", () => {
    const ym = vi.fn();
    trackEventWithCounter(null, ANALYTICS_EVENTS.cartOpen, undefined, ym);
    expect(ym).not.toHaveBeenCalled();
  });

  it("forwards Tire IQ job navigation without technical data", () => {
    const ym = vi.fn();
    trackEventWithCounter(42, ANALYTICS_EVENTS.tireIqJobClick, {
      job_key: "selection",
      destination: "selection",
    }, ym);

    expect(ym).toHaveBeenCalledWith(
      42,
      "reachGoal",
      "tire_iq_job_click",
      { job_key: "selection", destination: "selection" },
    );
  });
});
