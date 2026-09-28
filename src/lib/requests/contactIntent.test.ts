import { describe, expect, it } from "vitest";

import { resolveContactIntent } from "./contactIntent";

describe("resolveContactIntent", () => {
  it("maps whitelisted subjects to sourceForm and copy", () => {
    expect(resolveContactIntent(new URLSearchParams("subject=branding"))).toMatchObject({
      subject: "branding",
      sourceForm: "branding",
      title: "Обсудить брендирование",
    });
    expect(resolveContactIntent(new URLSearchParams("subject=supplier")).sourceForm).toBe(
      "supplier",
    );
    expect(resolveContactIntent(new URLSearchParams("subject=warranty")).sourceForm).toBe(
      "warranty",
    );
    expect(
      resolveContactIntent(new URLSearchParams("subject=wheel-selection")).sourceForm,
    ).toBe("wheel_selection");
  });

  it("ignores unknown subjects", () => {
    expect(resolveContactIntent(new URLSearchParams("subject=hack"))).toMatchObject({
      sourceForm: "contact",
      title: "Контакты",
    });
  });

  it("maps tire enquiry subject without a wizard context", () => {
    expect(resolveContactIntent(new URLSearchParams("subject=tire-selection"))).toMatchObject({
      subject: "tire-selection",
      sourceForm: "tire_selection",
    });
  });
});
