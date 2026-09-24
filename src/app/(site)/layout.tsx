import { YandexMetrika } from "@/components/analytics/YandexMetrika";
import { SiteShell } from "@/components/layout/SiteShell";
import { getMainDualPaneMenu, getShopDualPaneMenu } from "@/lib/content/getDualPaneMenu";

export const revalidate = 60;

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mainMenu, shopMenu] = await Promise.all([
    getMainDualPaneMenu(),
    getShopDualPaneMenu(),
  ]);

  return (
    <>
      <YandexMetrika />
      <SiteShell mainMenu={mainMenu} shopMenu={shopMenu}>
        {children}
      </SiteShell>
    </>
  );
}
