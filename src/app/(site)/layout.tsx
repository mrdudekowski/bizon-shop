import { YandexMetrika } from "@/components/analytics/YandexMetrika";
import { SiteShell } from "@/components/layout/SiteShell";
import { getMainDualPaneMenu, getShopDualPaneMenu } from "@/lib/content/getDualPaneMenu";
import { getPublishedStubOverlay } from "@/lib/content/getPageContent";

// CMS content is fetched with cache: "no-store"; do not advertise a 60-second
// route cache that could suggest published edits are delayed.

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mainMenu, shopMenu, contactPage] = await Promise.all([
    getMainDualPaneMenu(),
    getShopDualPaneMenu(),
    getPublishedStubOverlay("contact").catch(() => null),
  ]);

  return (
    <>
      <YandexMetrika />
      <SiteShell mainMenu={mainMenu} shopMenu={shopMenu} initialSiteProfile={contactPage?.siteProfile ?? null}>
        {children}
      </SiteShell>
    </>
  );
}
