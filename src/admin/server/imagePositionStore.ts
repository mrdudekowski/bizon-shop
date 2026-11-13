import type { ImagePosition } from "../domain/imagePositions";

type Query = (sql: string, params?: unknown[]) => Promise<unknown>;

export async function replaceStoredImagePositions(
  query: Query,
  collection: string,
  documentId: string,
  positions: readonly ImagePosition[],
): Promise<void> {
  await query("DELETE FROM cms_image_focal_positions WHERE collection = $1 AND doc_id = $2", [collection, documentId]);
  for (const position of positions) {
    if (!/^\d+$/.test(position.assetId)) continue;
    const desktop = position.focalByViewport?.desktop;
    await query(
      `INSERT INTO cms_image_focal_positions (collection, doc_id, placement_path, media_id, focal_x, focal_y, focal_by_viewport)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        collection,
        documentId,
        position.path,
        Number(position.assetId),
        desktop?.x ?? position.focalX,
        desktop?.y ?? position.focalY,
        position.focalByViewport ?? null,
      ],
    );
  }
}
