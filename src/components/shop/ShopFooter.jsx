import { SiteFooter } from "@/components/Footer/SiteFooter";

export function ShopFooter({ catalogLinks, siteProfile } = {}) {
  return <SiteFooter surface="shop" catalogLinks={catalogLinks} siteProfile={siteProfile} />;
}
