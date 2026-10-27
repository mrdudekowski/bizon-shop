import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { SmoothScrollRoot } from "@/components/scroll/SmoothScrollRoot";
import { createPageMetadata } from "@/lib/seo/metadata";
import "lenis/dist/lenis.css";
import "./globals.css";

const bounded = localFont({
  src: "../../public/Fonts/Bounded-Variable.ttf",
  variable: "--font-bounded",
  weight: "200 900",
  display: "swap",
});

const manrope = localFont({
  src: "../../public/Fonts/Manrope.ttf",
  variable: "--font-manrope",
  weight: "200 800",
  display: "swap",
});

export const metadata: Metadata = {
  ...createPageMetadata(),
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-light.png", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: "/favicon-dark.png", type: "image/png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [{ rel: "mask-icon", url: "/favicon.svg", color: "#222222" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${bounded.variable} ${manrope.variable}`} data-scroll-behavior="smooth">
      <body>
        <SmoothScrollRoot />
        {children}
      </body>
    </html>
  );
}
