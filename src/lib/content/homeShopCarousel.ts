import type { ShopHomePageContent } from "./pages/types";

export type HomeShopCarouselItem = {
  id: string;
  title: string;
  caption: string;
  iconUrl: string;
  iconAlt: string;
};

const DISK_ICON_URL = "/images/shop/category-icons/tire.svg";

export function buildHomeShopCarouselItems(shopHome: ShopHomePageContent): HomeShopCarouselItem[] {
  const categories = shopHome.catalog.tiles
    .map((tile, index) => ({ tile, index }))
    .filter(({ tile }) => tile.visible && tile.homeCarouselCaption?.trim() && tile.iconUrl?.trim())
    .sort((left, right) => left.tile.sortOrder - right.tile.sortOrder || left.index - right.index)
    .map(({ tile }) => ({
      id: `category-${tile.categoryId}`,
      title: tile.title,
      caption: tile.homeCarouselCaption!.trim(),
      iconUrl: tile.iconUrl!.trim(),
      iconAlt: tile.iconAlt?.trim() || tile.title,
    }));

  return [
    {
      id: "wheels",
      title: "Диски",
      caption: shopHome.homeCarousel.diskCaption.trim() || "Кованые диски, созданные под ваш автомобиль",
      iconUrl: DISK_ICON_URL,
      iconAlt: "Диск",
    },
    ...categories,
  ];
}
