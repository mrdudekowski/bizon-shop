import { describe, expect, it } from "vitest";
import { resolveServicePageCta, resolveServicePageProof } from "./servicePageEditorial";

describe("service page published proof and CTA", () => {
  it("uses the latest published proof values", () => {
    expect(resolveServicePageProof({
      proof: { imageUrl: "https://cdn.example.test/new.jpg", imageAlt: "Новое фото", imageFocalX: 0.2, imageFocalY: 0.8, title: "Новый заголовок", text: "Новый текст" },
    }, { src: "/old.jpg", alt: "Старое фото", title: "Старый заголовок", text: "Старый текст" })).toEqual({
      src: "https://cdn.example.test/new.jpg", alt: "Новое фото", focalX: 0.2, focalY: 0.8, title: "Новый заголовок", text: "Новый текст",
    });
  });

  it("uses the latest published CTA values", () => {
    expect(resolveServicePageCta({
      cta: { href: "/new", label: "Новая кнопка", secondaryHref: "/details", secondaryLabel: "Подробнее" },
    }, { href: "/old", label: "Старая кнопка" })).toEqual({
      href: "/new", label: "Новая кнопка", secondaryHref: "/details", secondaryLabel: "Подробнее",
    });
  });

  it("lets a publication explicitly remove proof and CTA", () => {
    expect(resolveServicePageProof({ proof: null }, { src: "/old.jpg", alt: "old", title: "old", text: "old" })).toBeUndefined();
    expect(resolveServicePageCta({ cta: null }, { href: "/old", label: "old" })).toBeUndefined();
  });
});
