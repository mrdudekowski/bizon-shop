import { SiteFooter } from "@/components/Footer/SiteFooter";

export function ShopFooter({ catalogLinks } = {}) {
  return <SiteFooter surface="shop" catalogLinks={catalogLinks} />;
}
