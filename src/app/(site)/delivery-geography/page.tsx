import { StaticRedirect, staticRedirectMetadata } from "@/components/seo/StaticRedirect";

const TARGET = "/delivery/";

export const metadata = staticRedirectMetadata(TARGET, "Доставка", "Переход на страницу доставки.");

export default function DeliveryGeographyPage() {
  return <StaticRedirect href={TARGET} label="Доставка" />;
}
