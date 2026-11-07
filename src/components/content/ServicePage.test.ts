import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FORM_SOURCE_BY_PAGE, ServicePage } from "./ServicePage";

describe("ServicePage documents", () => {
  it("hides empty CMS hero and editorial fields instead of rendering fallback copy", () => {
    const html = renderToStaticMarkup(
      createElement(ServicePage, {
        kicker: "",
        title: "",
        description: "",
        breadcrumbs: [],
        featuresHeading: "",
        features: [],
        notice: undefined,
        editorial: {
          featuresHeading: "",
          features: [],
          sections: [],
          notice: null,
          proof: null,
          cta: null,
        },
      }),
    );

    expect(html).not.toContain("<h1");
    expect(html).not.toContain("<h2");
    expect(html).not.toContain("<h3");
  });

  it("renders published document links with their CMS title", () => {
    const html = renderToStaticMarkup(
      createElement(ServicePage, {
        title: "Гарантия",
        description: "Условия",
        breadcrumbs: [],
        features: [],
        documents: [{ url: "https://cdn.example.test/warranty.pdf", title: "Условия гарантии" }],
      }),
    );

    expect(html).toContain("Документы");
    expect(html).toContain('href="https://cdn.example.test/warranty.pdf"');
    expect(html).toContain("Условия гарантии");
  });

  it("uses configured CMS editorial blocks instead of the legacy page content", () => {
    const html = renderToStaticMarkup(
      createElement(ServicePage, {
        title: "Гарантия",
        description: "Условия",
        breadcrumbs: [],
        features: [{ title: "Старый блок", text: "Не должен появиться" }],
        featuresHeading: "Старый заголовок",
        notice: "Старое уведомление",
        editorial: {
          featuresHeading: "Заголовок из CMS",
          features: [{ id: "cms-feature-1", title: "Факт из CMS", text: "Описание из CMS" }],
          sections: [{ id: "cms-section-1", heading: "Раздел из CMS", body: "Текст из CMS" }],
          notice: null,
          proof: null,
          cta: null,
        },
      }, createElement("p", null, "Старый раздел")),
    );

    expect(html).toContain("Заголовок из CMS");
    expect(html).toContain("01");
    expect(html).toContain("Факт из CMS");
    expect(html).toContain("Описание из CMS");
    expect(html).toContain("Раздел из CMS");
    expect(html).toContain("Текст из CMS");
    expect(html).not.toContain("Старый блок");
    expect(html).not.toContain("Старое уведомление");
    expect(html).not.toContain("Старый раздел");
  });

  it("keeps an explicitly empty CMS section list empty", () => {
    const html = renderToStaticMarkup(
      createElement(ServicePage, {
        title: "Гарантия",
        description: "Условия",
        breadcrumbs: [],
        features: [],
        editorial: { sections: [] },
      }, createElement("p", null, "Legacy paragraph")),
    );
    expect(html).not.toContain("Legacy paragraph");
  });

  it("shows text for an untitled section and point without an empty heading", () => {
    const html = renderToStaticMarkup(
      createElement(ServicePage, {
        title: "Гарантия",
        description: "Условия",
        breadcrumbs: [],
        features: [],
        editorial: {
          features: [{ id: "point", title: "", text: "Текст пункта без названия" }],
          sections: [{ id: "section", heading: "", body: "Текст раздела без названия" }],
        },
      }),
    );

    expect(html).toContain("Текст пункта без названия");
    expect(html).toContain("Текст раздела без названия");
    expect(html).not.toMatch(/<h2>\s*<\/h2>/);
    expect(html).not.toMatch(/<h3>\s*<\/h3>/);
  });

  it("drops a process heading and the next-step panel when the page already has a request form", () => {
    const html = renderToStaticMarkup(
      createElement(ServicePage, {
        title: "Стать поставщиком",
        description: "Лид",
        breadcrumbs: [],
        features: [],
        runtimePageKey: "become-a-supplier",
        editorial: {
          hero: { title: "Стать поставщиком", lead: "Лид" },
          featuresHeading: "Как проходит первичное обращение",
          features: [],
          sections: [{ id: "cooperation", heading: "", body: "Условия сотрудничества." }],
          notice: null,
          proof: null,
          cta: { label: "Оставить заявку", href: "/contact?subject=supplier" },
        },
      }),
    );

    expect(html).toContain("Условия сотрудничества.");
    expect(html).not.toContain("Как проходит первичное обращение");
    expect(html).not.toContain("Следующий шаг");
    expect(html).not.toContain("Оставить заявку");
  });

  it("keeps warranty points and hides the process heading above them", () => {
    const html = renderToStaticMarkup(
      createElement(ServicePage, {
        title: "Гарантия",
        description: "Условия",
        breadcrumbs: [],
        features: [],
        editorial: {
          featuresHeading: "Три шага для первичной проверки",
          features: [{ id: "step", title: "Зафиксируйте данные", text: "Подготовьте модель и размер." }],
          sections: [],
          notice: null,
          proof: null,
          cta: { label: "Задать вопрос по гарантии", href: "/contact?subject=warranty" },
        },
      }),
    );

    expect(html).toContain("Зафиксируйте данные");
    expect(html).toContain("Следующий шаг");
    expect(html).not.toContain("Три шага для первичной проверки");
  });

  it("binds delivery to delivery_quote, renders a shop form, and keeps shop payment on the shop cart", () => {
    expect(FORM_SOURCE_BY_PAGE).toMatchObject({
      delivery: "delivery_quote",
      "shop-delivery": "shop_delivery",
      warranty: "warranty",
      "shop-warranty": "shop_warranty",
      "become-a-supplier": "supplier",
      "shop-become-a-supplier": "shop_supplier",
      branding: "branding",
    });
    expect(FORM_SOURCE_BY_PAGE.payment).toBeUndefined();
    expect(FORM_SOURCE_BY_PAGE["shop-payment"]).toBeUndefined();

    const shopDelivery = renderToStaticMarkup(
      createElement(ServicePage, {
        title: "Доставка",
        description: "Лид",
        breadcrumbs: [],
        features: [],
        runtimePageKey: "shop-delivery",
        editorial: {
          hero: { title: "Доставка", lead: "Лид" },
          cta: { label: "Уточнить", href: "/contact" },
          form: {
            pageKey: "shop-delivery",
            successMessage: "Спасибо",
            fields: [{ id: "name", label: "Имя получателя", type: "text", required: true }],
          },
        },
      }),
    );
    expect(shopDelivery).toContain("Имя получателя");
    expect(shopDelivery).not.toContain("Следующий шаг");

    const shopPayment = renderToStaticMarkup(
      createElement(ServicePage, {
        title: "Оплата",
        description: "",
        breadcrumbs: [],
        features: [],
        runtimePageKey: "shop-payment",
        editorial: {
          hero: { title: "Оплата", lead: "" },
          cta: { label: "К корзине", href: "/cart" },
          form: {
            pageKey: "shop-delivery",
            successMessage: "Спасибо",
            fields: [{ id: "name", label: "Имя получателя", type: "text", required: true }],
          },
        },
      }),
    );
    expect(shopPayment).toContain('href="/shop/cart"');
    expect(shopPayment).not.toContain('href="/cart"');
    expect(shopPayment).not.toContain("<form");
    expect(shopPayment).not.toContain("Имя получателя");
  });

  it("links each condition page to the other pages of the same site", () => {
    const payment = renderToStaticMarkup(
      createElement(ServicePage, {
        title: "Оплата",
        description: "",
        breadcrumbs: [],
        features: [],
        runtimePageKey: "payment",
      }),
    );
    expect(payment).toContain('aria-current="page"');
    expect(payment).toContain("Информация о ценах и наличии товаров на сайте носит информационный характер. Это запрос на подбор, а не покупка: цена и совместимость подтверждаются специалистом. Часть продукции может быть доступна под заказ.");
    expect(payment).not.toContain("Срок поставки зависит от производителя");
    expect(payment).toContain('href="/delivery"');
    expect(payment).toContain('href="/warranty"');
    expect(payment).not.toContain('href="/shop/delivery"');

    const shopWarranty = renderToStaticMarkup(
      createElement(ServicePage, {
        title: "Гарантия и возврат",
        description: "",
        breadcrumbs: [],
        features: [],
        runtimePageKey: "shop-warranty",
      }),
    );
    expect(shopWarranty).toContain('href="/shop/payment"');
    expect(shopWarranty).toContain('href="/shop/delivery"');
    expect(shopWarranty).not.toContain('href="/warranty"');
    expect(shopWarranty).not.toContain("Информация о ценах и наличии");

    const delivery = renderToStaticMarkup(
      createElement(ServicePage, {
        title: "Доставка",
        description: "",
        breadcrumbs: [],
        features: [],
        runtimePageKey: "delivery",
      }),
    );
    expect(delivery).toContain("Срок поставки зависит от производителя, наличия продукции, объема заказа, производственного цикла и выбранной логистической схемы. Если товар отсутствует в наличии, возможность и сроки поставки под заказ уточняются индивидуально. Точные сроки, стоимость и условия поставки сообщаются после обработки заявки.");
    expect(delivery).not.toContain("Это запрос на подбор");
  });
});
