import { SiteFooter } from "@/components/Footer/SiteFooter";

export function ShopFooter({ catalogLinks, footerContact } = {}) {
  return <SiteFooter surface="shop" catalogLinks={catalogLinks} footerContact={footerContact} />;
}
