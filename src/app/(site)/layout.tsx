import { YandexMetrika } from "@/components/analytics/YandexMetrika";
import { SiteShell } from "@/components/layout/SiteShell";
import { getMainDualPaneMenu, getShopDualPaneMenu } from "@/lib/content/getDualPaneMenu";

// CMS content is fetched with cache: "no-store"; do not advertise a 60-second
// route cache that could suggest published edits are delayed.

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
