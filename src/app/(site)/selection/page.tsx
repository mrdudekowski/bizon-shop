import type { Metadata } from "next";
import Link from "next/link";

import { ROUTES } from "@/constants/navigation";

import { SelectionCatalogRedirect } from "./SelectionCatalogRedirect";

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function SelectionPage() {
  return (
    <div className="section-inner text-center py-20">
      <SelectionCatalogRedirect />
      <h1 className="section-title">Каталог моделей</h1>
      <p className="section-description">
        <Link href={ROUTES.models} className="btn-accent inline-flex mt-8">Открыть каталог</Link>
      </p>
    </div>
  );
}
