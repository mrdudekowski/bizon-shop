import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminShell } from "@/admin/shell/AdminShell";

import "./globals.css";

export const metadata: Metadata = {
  title: "BIZON",
  icons: {
    icon: [
      { url: "/favicon-light.png", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: "/favicon-dark.png", type: "image/png", media: "(prefers-color-scheme: dark)" },
    ],
  },
};

export const viewport = {
  viewportFit: "cover" as const,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
