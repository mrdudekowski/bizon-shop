import type { Where } from "payload";

import {
  CATALOG_AXES,
  getAxisById,
  getAxisByRelationTo,
  type CatalogAxis,
  type CatalogAxisId,
  type CatalogFilterStep,
  type CatalogRelationTo,
  type CollectionFilterStep,
} from "@/lib/catalog/catalogNav";
import { parseCatalogRelation } from "@/lib/catalog/parseCatalogRelation";

export type { CatalogAxisId, CatalogRelationTo, CatalogFilterStep, CollectionFilterStep, CatalogAxis };
export { CATALOG_AXES, getAxisById, getAxisByRelationTo };

export function buildTargetWhere(
  axis: CatalogAxis,
  filters: Record<string, string | null>,
): Where | true {
  const conditions: Where[] = [];

  for (const step of axis.steps) {
    const value = filters[step.id];
    if (value) {
      conditions.push({ [step.filterField]: { equals: value } });
    }
  }

  return conditions.length ? { and: conditions } : true;
}

export function extractFiltersFromDoc(
  axis: CatalogAxis,
  doc: Record<string, unknown>,
): Record<string, string | null> {
  const filters: Record<string, string | null> = {};

  for (const step of axis.steps) {
    const raw = doc[step.filterField];
    if (raw == null) continue;

    if (typeof raw === "object" && raw !== null && "id" in raw) {
      filters[step.id] = String((raw as { id: string | number }).id);
      continue;
    }

    filters[step.id] = String(raw);
  }

  return filters;
}

export function hasRelatedProduct(value: unknown): boolean {
  if (value == null || value === "") return false;

  if (typeof value === "object" && value !== null && "relationTo" in value && "value" in value) {
    const inner = (value as { value: unknown }).value;
    return inner != null && inner !== "";
  }

  return true;
}

export function parseStoredRelation(value: unknown): {
  relationTo: CatalogRelationTo;
  doc: Record<string, unknown> | null;
} | null {
  const parsed = parseCatalogRelation(value);
  if (!parsed || !getAxisByRelationTo(parsed.relationTo)) return null;

  return { relationTo: parsed.relationTo, doc: parsed.doc };
}
