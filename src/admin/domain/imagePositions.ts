export type ImagePosition = {
  path: string;
  assetId: string;
  focalX: number;
  focalY: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clamp(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.5;
}

export function flattenImagePositions(value: unknown): ImagePosition[] {
  const result: ImagePosition[] = [];
  const visit = (node: unknown, path: string) => {
    if (Array.isArray(node)) {
      node.forEach((item, index) => visit(item, path ? `${path}.${index}` : String(index)));
      return;
    }
    if (!isRecord(node)) return;
    if (typeof node.assetId === "string" && "focalX" in node && "focalY" in node) {
      result.push({ path, assetId: node.assetId, focalX: clamp(node.focalX), focalY: clamp(node.focalY) });
      return;
    }
    for (const [key, child] of Object.entries(node)) visit(child, path ? `${path}.${key}` : key);
  };
  visit(value, "");
  return result;
}

export function restoreImagePositions<T>(value: T, positions: readonly ImagePosition[]): T {
  const byPath = new Map(positions.map((position) => [position.path, position]));
  const visit = (node: unknown, path: string): unknown => {
    if (Array.isArray(node)) return node.map((item, index) => visit(item, path ? `${path}.${index}` : String(index)));
    if (!isRecord(node)) return node;
    if (typeof node.assetId === "string" && "focalX" in node && "focalY" in node) {
      const saved = byPath.get(path);
      return saved?.assetId === node.assetId
        ? { ...node, focalX: clamp(saved.focalX), focalY: clamp(saved.focalY) }
        : { ...node, focalX: 0.5, focalY: 0.5 };
    }
    return Object.fromEntries(Object.entries(node).map(([key, child]) => [key, visit(child, path ? `${path}.${key}` : key)]));
  };
  return visit(value, "") as T;
}
