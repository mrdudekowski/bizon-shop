import type { DocumentLink } from "./admin/domain/types";

export type DocumentRow = {
  media_id?: unknown;
  asset_id?: unknown;
  title?: unknown;
  url?: unknown;
};

export type PublishedDocument = { url: string; title: string };

export function mapAdminDocumentLinks(rows: DocumentRow[]): DocumentLink[] {
  return rows.flatMap((row) => {
    const assetId = row.media_id ?? row.asset_id;
    if (assetId == null) return [];
    return [{ assetId: String(assetId), title: typeof row.title === "string" ? row.title : "" }];
  });
}

export function mapPublishedDocuments(rows: DocumentRow[]): PublishedDocument[] {
  return rows.flatMap((row) => {
    if (typeof row.url !== "string" || !row.url.trim()) return [];
    return [{ url: row.url, title: typeof row.title === "string" ? row.title : "" }];
  });
}
