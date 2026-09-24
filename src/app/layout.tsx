import type { ReactNode } from "react";

import { AdminShell } from "@/admin/shell/AdminShell";

import "./globals.css";

export const metadata = {
  title: "BIZON",
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
