import { isCatalogRelationTo, type CatalogRelationTo } from "@/lib/catalog/catalogNav";

export type ParsedCatalogRelation = {
  relationTo: CatalogRelationTo;
  id: number | string;
  slug?: string;
  doc: Record<string, unknown> | null;
};

export function parseCatalogRelation(value: unknown): ParsedCatalogRelation | null {
  if (value == null || value === "") return null;

  if (typeof value === "object" && value !== null && "relationTo" in value && "value" in value) {
    const relationTo = (value as { relationTo: unknown }).relationTo;
    const storedValue = (value as { value: unknown }).value;

    if (typeof relationTo !== "string" || !isCatalogRelationTo(relationTo) || storedValue == null) {
      return null;
    }

    if (typeof storedValue === "object" && storedValue !== null && "id" in storedValue) {
      const doc = storedValue as Record<string, unknown> & { id: number | string; slug?: unknown };
      return {
        relationTo,
        id: doc.id,
        slug: typeof doc.slug === "string" ? doc.slug : undefined,
        doc: storedValue as Record<string, unknown>,
      };
    }

    return { relationTo, id: storedValue as number | string, doc: null };
  }

  if (typeof value === "number" || typeof value === "string") {
    return { relationTo: "products", id: value, doc: null };
  }

  if (typeof value === "object" && value !== null && "id" in value) {
    const doc = value as Record<string, unknown> & { id: number | string; slug?: unknown };
    return {
      relationTo: "products",
      id: doc.id,
      slug: typeof doc.slug === "string" ? doc.slug : undefined,
      doc: value as Record<string, unknown>,
    };
  }

  return null;
}

/** ponytail: runnable self-check — fails if parser drops polymorphic or legacy shapes */
export function parseCatalogRelationSelfCheck(): void {
  const polymorphic = parseCatalogRelation({
    relationTo: "tire-models",
    value: { id: 1, slug: "dsr188", tireType: 2 },
  });
  if (polymorphic?.relationTo !== "tire-models" || polymorphic.id !== 1 || polymorphic.doc?.slug !== "dsr188") {
    throw new Error("parseCatalogRelation: polymorphic shape failed");
  }

  const legacy = parseCatalogRelation(42);
  if (legacy?.relationTo !== "products" || legacy.id !== 42) {
    throw new Error("parseCatalogRelation: legacy id failed");
  }
}

if (process.env.NODE_ENV !== "production") {
  parseCatalogRelationSelfCheck();
}
