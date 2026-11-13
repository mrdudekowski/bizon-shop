import { FOCAL_VIEWPORTS } from "./types";
import type { FocalByViewport } from "./types";

export type ImagePosition = {
  path: string;
  assetId: string;
  focalX: number;
  focalY: number;
  focalByViewport?: FocalByViewport;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clamp(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.5;
}

function normalizeFocalByViewport(value: unknown): FocalByViewport | undefined {
  if (!isRecord(value)) return undefined;
  const result: FocalByViewport = {};
  for (const viewport of FOCAL_VIEWPORTS) {
    const point = value[viewport];
    if (!isRecord(point) || typeof point.x !== "number" || typeof point.y !== "number") continue;
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
    result[viewport] = { x: clamp(point.x), y: clamp(point.y) };
  }
  return Object.keys(result).length === 0 ? undefined : result;
}

function encodeIdentity(value: string): string {
  return encodeURIComponent(value).replaceAll(".", "%2E");
}

function categoryTileSegment(categoryId: string): string {
  return `@categoryId=${encodeIdentity(categoryId)}`;
}

function variantSegment(variantId: string): string {
  return `@variantId=${encodeIdentity(variantId)}`;
}

export function shopCarouselImagePositionPath(categoryId: string): string {
  return `catalog.tiles.${categoryTileSegment(categoryId)}.carouselImage`;
}

export function productVariantImagePositionPath(variantId: string): string {
  return `variants.${variantSegment(variantId)}.image`;
}

function stableArrayItemPath(parentPath: string, item: unknown): string | null {
  if (!isRecord(item)) return null;
  if (parentPath === "catalog.tiles" && typeof item.categoryId === "string") {
    return `${parentPath}.${categoryTileSegment(item.categoryId)}`;
  }
  if (parentPath === "variants" && typeof item.id === "string") {
    return `${parentPath}.${variantSegment(item.id)}`;
  }
  return null;
}

export function flattenImagePositions(value: unknown): ImagePosition[] {
  const result: ImagePosition[] = [];
  const visit = (node: unknown, path: string) => {
    if (Array.isArray(node)) {
      node.forEach((item, index) => {
        const indexPath = path ? `${path}.${index}` : String(index);
        visit(item, stableArrayItemPath(path, item) ?? indexPath);
      });
      return;
    }
    if (!isRecord(node)) return;
    if (typeof node.assetId === "string" && "focalX" in node && "focalY" in node) {
      const focalByViewport = normalizeFocalByViewport(node.focalByViewport);
      result.push({
        path,
        assetId: node.assetId,
        focalX: clamp(node.focalX),
        focalY: clamp(node.focalY),
        ...(focalByViewport === undefined ? {} : { focalByViewport }),
      });
      return;
    }
    for (const [key, child] of Object.entries(node)) visit(child, path ? `${path}.${key}` : key);
  };
  visit(value, "");
  return result;
}

export function restoreImagePositions<T>(value: T, positions: readonly ImagePosition[]): T {
  const byPath = new Map(positions.map((position) => [position.path, position]));
  const visit = (node: unknown, path: string, legacyPath: string): unknown => {
    if (Array.isArray(node)) {
      return node.map((item, index) => {
        const indexPath = path ? `${path}.${index}` : String(index);
        const stablePath = stableArrayItemPath(path, item) ?? indexPath;
        const legacyIndexPath = legacyPath ? `${legacyPath}.${index}` : String(index);
        return visit(item, stablePath, legacyIndexPath);
      });
    }
    if (!isRecord(node)) return node;
    if (typeof node.assetId === "string" && "focalX" in node && "focalY" in node) {
      const saved = byPath.get(path) ?? (path === legacyPath ? undefined : byPath.get(legacyPath));
      if (saved?.assetId === node.assetId) {
        return {
          ...node,
          focalX: clamp(saved.focalX),
          focalY: clamp(saved.focalY),
          ...(saved.focalByViewport ? { focalByViewport: normalizeFocalByViewport(saved.focalByViewport) } : {}),
        };
      }
      return { ...node, focalX: 0.5, focalY: 0.5, focalByViewport: undefined };
    }
    return Object.fromEntries(Object.entries(node).map(([key, child]) => [
      key,
      visit(child, path ? `${path}.${key}` : key, legacyPath ? `${legacyPath}.${key}` : key),
    ]));
  };
  return visit(value, "", "") as T;
}
