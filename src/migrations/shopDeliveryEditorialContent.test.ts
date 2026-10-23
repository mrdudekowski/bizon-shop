import { describe, expect, it } from "vitest";
import { shopDeliveryEditorialContentMigration } from "./0017-shop-delivery-editorial-content";

describe("Shop delivery and returns CMS migration", () => {
  it("moves the currently rendered notice and sections into the editorial record", () => {
    expect(shopDeliveryEditorialContentMigration.version).toBe("202610230017");
    expect(shopDeliveryEditorialContentMigration.sql).toContain("Оформление заявки");
    expect(shopDeliveryEditorialContentMigration.sql).toContain("До использования товара направьте заявку с номером заказа и фотографиями.");
    expect(shopDeliveryEditorialContentMigration.sql).toContain("Shop принимает заявку, а не онлайн-оплату.");
  });

  it("leaves pages with existing editorial content untouched", () => {
    expect(shopDeliveryEditorialContentMigration.sql).toContain("WHERE key::text = 'shop-delivery-returns'");
    expect(shopDeliveryEditorialContentMigration.sql).toContain("AND editorial_configured = false");
    expect(shopDeliveryEditorialContentMigration.sql).not.toContain("status = 'published'");
  });
});
