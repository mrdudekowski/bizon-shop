import { locateField } from "./changeFieldCatalog";
import type { FieldChange, FieldValue, ImagePlacement, MediaAsset, StatusEntity } from "./types";

type AssetPreview = Pick<MediaAsset, "id" | "dataUrl">;

function looksLikePlacement(value: unknown): value is ImagePlacement {
  return (
    value != null &&
    typeof value === "object" &&
    "assetId" in value &&
    "focalX" in value &&
    "focalY" in value &&
    "crop" in value
  );
}

function imageKey(value: ImagePlacement): string {
  const crop = value.crop;
  return `${value.assetId}|${value.focalX}|${value.focalY}|${crop.x}|${crop.y}|${crop.width}|${crop.height}`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function toPath(prefix: string, key: string | number): string {
  if (typeof key === "number") return `${prefix}[${key}]`;
  return prefix ? `${prefix}.${key}` : key;
}

export function flattenDraftPaths(value: unknown, prefix = ""): string[] {
  if (value == null) return prefix ? [prefix] : [];
  if (looksLikePlacement(value)) return prefix ? [prefix] : [];
  if (Array.isArray(value)) {
    if (value.every((item) => item == null || typeof item !== "object")) return prefix ? [prefix] : [];
    return value.flatMap((item, index) => flattenDraftPaths(item, toPath(prefix, index)));
  }
  if (isPlainObject(value)) {
    return Object.entries(value).flatMap(([key, child]) => {
      if (key === "id") return [];
      return flattenDraftPaths(child, toPath(prefix, key));
    });
  }
  return prefix ? [prefix] : [];
}

function readPath(value: unknown, path: string): unknown {
  if (!path) return value;
  let current = value;
  for (const match of path.matchAll(/([^[.\]]+)|\[(\d+)\]/g)) {
    if (current == null || typeof current !== "object") return undefined;
    const key = match[1] ?? match[2];
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function toFieldValue(value: unknown, assets: AssetPreview[] | undefined): FieldValue {
  if (value == null) return { kind: "empty" };
  if (looksLikePlacement(value)) {
    return {
      kind: "image",
      assetId: value.assetId,
      previewUrl: assets?.find((asset) => asset.id === value.assetId)?.dataUrl ?? null,
      alt: value.alt,
    };
  }
  if (typeof value === "boolean") return { kind: "boolean", value };
  if (typeof value === "number") return { kind: "number", value };
  if (Array.isArray(value) && value.every((item) => item == null || typeof item !== "object")) {
    return { kind: "text", value: value.map((item) => String(item ?? "")).join(", ") };
  }
  if (typeof value === "object") return { kind: "text", value: JSON.stringify(value) };
  return { kind: "text", value: String(value) };
}

function sameValue(left: unknown, right: unknown): boolean {
  if (looksLikePlacement(left) && looksLikePlacement(right)) return imageKey(left) === imageKey(right);
  if (Array.isArray(left) && Array.isArray(right) && left.every((item) => item == null || typeof item !== "object")) {
    return JSON.stringify(left) === JSON.stringify(right);
  }
  return Object.is(left, right) || (left == null && right == null);
}

export function diffDraft(
  before: unknown,
  after: unknown,
  entityType: StatusEntity,
  assets?: AssetPreview[],
): FieldChange[] {
  const paths = new Set([...flattenDraftPaths(before), ...flattenDraftPaths(after)]);
  const changes: FieldChange[] = [];
  for (const path of paths) {
    const previous = readPath(before, path);
    const next = readPath(after, path);
    if (sameValue(previous, next)) continue;
    const locationDraft = after ?? before;
    changes.push({
      path,
      location: locateField(entityType, path, locationDraft),
      before: before == null && previous == null ? { kind: "empty" } : toFieldValue(previous, assets),
      after: toFieldValue(next, assets),
    });
  }
  return changes;
}
