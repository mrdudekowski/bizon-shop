import Link from "next/link";

import { ROUTES } from "@/constants/navigation";

export default function SelectionPage() {
  return (
    <div className="section-inner text-center py-20">
      <meta httpEquiv="refresh" content={`0; url=${ROUTES.models}`} />
      <h1 className="section-title">Каталог моделей</h1>
      <p className="section-description">
        <Link href={ROUTES.models} className="btn-accent inline-flex mt-8">Открыть каталог</Link>
      </p>
    </div>
  );
}
