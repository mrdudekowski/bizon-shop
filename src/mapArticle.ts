import { lexicalToHtml, normalizeImageUrl, toFiniteNumber } from "./mapTire";

type ArticleRow = {
  title: string;
  slug: string;
  excerpt: string;
  content: unknown;
  published_at: Date | null;
  image_url: string | null;
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
    content: lexicalToHtml(row.content),
    imageUrl: normalizeImageUrl(row.image_url),
    imageConfigured: row.featured_image_configured === true,
    showInMenu: row.show_in_menu,
    menuOrder: toFiniteNumber(row.menu_order) ?? 0,
    taxonomy: row.taxonomy ?? [],
  };
}
