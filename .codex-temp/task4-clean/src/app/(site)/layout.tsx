import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SiteShell } from "@/components/layout/SiteShell";
import { getMenuItems } from "@/lib/cms";
import { createPageMetadata } from "@/lib/seo/metadata";
import "../globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = createPageMetadata();

/** ponytail: ISR baseline — admin publishes appear within ~60s even without on-demand revalidate */
export const revalidate = 60;

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuItems = await getMenuItems();

  return (
    <html lang="ru" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var k="theme",s=localStorage.getItem(k),d=s==="dark"?true:s==="light"?false:window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");})();`,
          }}
        />
      </head>
      <body>
        <SiteShell menuItems={menuItems}>{children}</SiteShell>
      </body>
    </html>
  );
}
