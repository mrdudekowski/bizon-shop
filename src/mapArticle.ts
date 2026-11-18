import { normalizeImageUrl, toFiniteNumber } from "./mapTire";
import { articleBodyToHtml } from "./articleBody";

type ArticleRow = {
  title: string;
  slug: string;
  excerpt: string;
  content: unknown;
  published_at: Date | null;
  image_url: string | null;
  image_alt?: string | null;
  body_media?: Record<string, string> | null;
  image_focal_x?: number | null;
  image_focal_y?: number | null;
  image_focal_by_viewport?: Partial<Record<"desktop" | "tablet" | "mobile", { x: number; y: number }>> | null;
  featured_image_configured: boolean;
  show_in_menu: boolean;
  menu_order: number;
  taxonomy?: string[];
};

export type CmsArticle = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  content: string;
  imageUrl: string | null;
  imageAlt?: string;
  imageFocalX?: number;
  imageFocalY?: number;
  imageFocalByViewport?: Partial<Record<"desktop" | "tablet" | "mobile", { x: number; y: number }>>;
  imageConfigured: boolean;
  showInMenu: boolean;
  menuOrder: number;
  taxonomy: string[];
};

export function mapArticle(row: ArticleRow): CmsArticle {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    publishedAt: row.published_at?.toISOString() ?? "",
    content: articleBodyToHtml(row.content, row.body_media ?? {}),
    imageUrl: normalizeImageUrl(row.image_url),
    ...(row.image_alt != null ? { imageAlt: row.image_alt } : {}),
    ...(typeof row.image_focal_x === "number" ? { imageFocalX: row.image_focal_x } : {}),
    ...(typeof row.image_focal_y === "number" ? { imageFocalY: row.image_focal_y } : {}),
    ...(row.image_focal_by_viewport ? { imageFocalByViewport: row.image_focal_by_viewport } : {}),
    imageConfigured: row.featured_image_configured === true,
    showInMenu: row.show_in_menu,
    menuOrder: toFiniteNumber(row.menu_order) ?? 0,
    taxonomy: row.taxonomy ?? [],
  };
}
