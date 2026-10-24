import { notFound } from "next/navigation";
import { DeliveryAndReturnsContent } from "@/components/content/DeliveryAndReturnsContent";
import { getPublishedStubOverlay } from "@/lib/content/getPageContent";
import { createPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata() {
  const page = await getPublishedStubOverlay("shop-delivery-returns");
  return createPageMetadata({
    title: page?.seoTitle ?? "",
    description: page?.seoDescription ?? "",
    path: "/shop/delivery-and-returns",
  });
}

export default async function DeliveryAndReturnsPage() {
  const page = await getPublishedStubOverlay("shop-delivery-returns");
  if (!page) notFound();
  return <DeliveryAndReturnsContent page={page} />;
}
