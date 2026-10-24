import type { PublishedStubOverlay } from "@/lib/content/getPageContent";
import type { ServiceCta } from "./ServicePage";

type ServiceProof = { src?: string; alt: string; focalX?: number; focalY?: number; title: string; text: string };

export function resolveServicePageProof(
  editorial: Pick<PublishedStubOverlay, "proof"> | null | undefined,
  fallback?: ServiceProof,
): ServiceProof | undefined {
  if (editorial?.proof === undefined) return fallback;
  if (editorial.proof === null) return undefined;
  const proof = editorial.proof;
  return {
    ...(proof.imageUrl ? { src: proof.imageUrl } : {}),
    alt: proof.imageAlt ?? "",
    ...(proof.imageFocalX !== undefined ? { focalX: proof.imageFocalX } : {}),
    ...(proof.imageFocalY !== undefined ? { focalY: proof.imageFocalY } : {}),
    title: proof.title,
    text: proof.text,
  };
}

export function resolveServicePageCta(
  editorial: Pick<PublishedStubOverlay, "cta"> | null | undefined,
  fallback?: ServiceCta,
): ServiceCta | undefined {
  if (editorial?.cta === undefined) return fallback;
  if (editorial.cta === null) return undefined;
  return editorial.cta;
}
