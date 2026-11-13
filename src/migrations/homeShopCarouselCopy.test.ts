import { describe, expect, it } from "vitest";
import { MIGRATIONS } from "./index";
import { homeShopCarouselCopyMigration } from "./0038-home-shop-carousel-copy";

describe("homepage Shop carousel copy migration", () => {
  it("registers the disk and category caption columns and seeds approved copy", () => {
    expect(MIGRATIONS).toContain(homeShopCarouselCopyMigration);
    expect(homeShopCarouselCopyMigration.version).toBe("202611120038");
    expect(homeShopCarouselCopyMigration.sql).toContain("shop_home_disk_carousel_caption");
    expect(homeShopCarouselCopyMigration.sql).toContain("home_carousel_caption");
    expect(homeShopCarouselCopyMigration.sql).toContain("Кованые диски, созданные под ваш автомобиль");
    expect(homeShopCarouselCopyMigration.sql).toContain("Аксессуары для вашего стиля");
    expect(homeShopCarouselCopyMigration.sql).toContain("Обвесы и аксессуары для вашего авто");
    expect(homeShopCarouselCopyMigration.sql).toContain("Всё для поездок, отдыха и маршрутов за городом");
    expect(homeShopCarouselCopyMigration.sql).toContain("Масла и детали для регулярного обслуживания");
    expect(homeShopCarouselCopyMigration.sql).toContain("Прицеп — сердце вашего off-road-путешествия");
  });

  it("keeps existing category captions when the migration runs again", () => {
    expect(homeShopCarouselCopyMigration.sql).toContain("AND tiles.home_carousel_caption = ''");
  });
});
