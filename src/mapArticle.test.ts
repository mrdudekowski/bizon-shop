import { describe, expect, it } from "vitest";
import { mapArticle } from "./mapArticle";

describe("mapArticle", () => {
  it("converts Lexical content and maps article fields", () => {
    expect(
      mapArticle({
        title: "Как выбрать шины",
        slug: "how-to-choose-tires",
        excerpt: "Кратко",
        content: {
          root: {
            children: [{ children: [{ text: "Полный текст" }] }],
          },
        },
        published_at: new Date("2026-09-25T06:52:00.000Z"),
        image_url: "/media/article.jpg",
        show_in_menu: true,
        menu_order: 3,
      }),
    ).toEqual({
      title: "Как выбрать шины",
      slug: "how-to-choose-tires",
      excerpt: "Кратко",
      publishedAt: "2026-09-25T06:52:00.000Z",
      content: "<p>Полный текст</p>",
      imageUrl: "/media/article.jpg",
      showInMenu: true,
      menuOrder: 3,
    });
  });

  it("uses an empty publication date and drops data image urls", () => {
    expect(
      mapArticle({
        title: "Без даты",
        slug: "without-date",
        excerpt: "",
        content: "Текст",
        published_at: null,
        image_url: "data:image/png;base64,AAAA",
        show_in_menu: false,
        menu_order: 0,
      }),
    ).toMatchObject({
      publishedAt: "",
      content: "<p>Текст</p>",
      imageUrl: null,
    });
  });

  it("normalizes a numeric database string for menu order", () => {
    const article = mapArticle({
      title: "Статья",
      slug: "article",
      excerpt: "",
      content: "Текст",
      published_at: null,
      image_url: null,
      show_in_menu: true,
      menu_order: "4" as unknown as number,
    });

    expect(article.menuOrder).toBe(4);
  });
});
