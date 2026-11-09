import { StaticRedirect, staticRedirectMetadata } from "@/components/seo/StaticRedirect";

const TARGET = "/shop/delivery/";

export const metadata = staticRedirectMetadata(
  TARGET,
  "Доставка BIZON Shop",
  "Переход на страницу доставки BIZON Shop.",
);

export default function DeliveryAndReturnsPage() {
  return <StaticRedirect href={TARGET} label="Доставка BIZON Shop" />;
}
