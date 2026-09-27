import { notFound } from "next/navigation";

import { PageEditor } from "@/admin/pages/PageEditor";
import { PAGE_KEYS, type PageKey } from "@/admin/domain/types";

export default async function PageDocument({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!PAGE_KEYS.includes(key as PageKey)) notFound();
  return <PageEditor pageKey={key as PageKey} />;
}
