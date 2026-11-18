export type ArticleBodyBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "image"; assetId: string | null; alt: string; caption: string };

export type ArticleBodyDocument = { version: 1; blocks: ArticleBodyBlock[] };

type BodyNode = {
  type?: unknown;
  text?: unknown;
  tag?: unknown;
  listType?: unknown;
  level?: unknown;
  assetId?: unknown;
  mediaId?: unknown;
  alt?: unknown;
  caption?: unknown;
  ordered?: unknown;
  items?: unknown;
  children?: unknown;
};

function node(value: unknown): BodyNode {
  return value != null && typeof value === "object" ? value as BodyNode : {};
}

function textOf(value: unknown): string {
  if (Array.isArray(value)) return value.map(textOf).join("");
  const item = node(value);
  if (typeof item.text === "string") return item.text;
  return textOf(item.children);
}

function decodeHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|h2|h3|li)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .trim();
}

function legacyString(value: string): string {
  return /<(?:p|h[23]|ul|ol|figure)\b/i.test(value) ? decodeHtml(value) : value;
}

function normalizeLegacyNode(value: unknown): ArticleBodyBlock | null {
  const item = node(value);
  const type = String(item.type ?? "");
  if (type === "articleImage" || type === "image") {
    const rawId = item.assetId ?? item.mediaId;
    return {
      type: "image",
      assetId: rawId != null && /^\d+$/.test(String(rawId)) ? String(rawId) : null,
      alt: typeof item.alt === "string" ? item.alt : "",
      caption: typeof item.caption === "string" ? item.caption : "",
    };
  }
  if (type === "paragraph") return { type: "paragraph", text: textOf(item.children) };
  if (type === "heading") return {
    type: "heading",
    level: item.tag === "h3" || item.level === 3 ? 3 : 2,
    text: textOf(item.children),
  };
  if (type === "list") {
    const children = Array.isArray(item.children) ? item.children : [];
    return {
      type: "list",
      ordered: item.listType === "number" || item.listType === "ordered" || item.tag === "ol",
      items: children.map((child) => textOf(node(child).children)).filter((text) => text.length > 0),
    };
  }
  const text = textOf(item.children);
  return text ? { type: "paragraph", text } : null;
}

export function emptyArticleBody(): ArticleBodyDocument {
  return { version: 1, blocks: [] };
}

export function normalizeArticleBody(value: unknown): ArticleBodyDocument {
  if (typeof value === "string") {
    const text = legacyString(value);
    return { version: 1, blocks: text ? [{ type: "paragraph", text }] : [] };
  }
  if (value == null || typeof value !== "object") return emptyArticleBody();

  const stored = value as { version?: unknown; blocks?: unknown; root?: unknown; children?: unknown };
  if (stored.version === 1 && Array.isArray(stored.blocks)) {
    const blocks = stored.blocks.flatMap((entry): ArticleBodyBlock[] => {
      const item = node(entry);
      if (item.type === "paragraph" && typeof item.text === "string") return [{ type: "paragraph", text: item.text }];
      if (item.type === "heading" && typeof item.text === "string") return [{ type: "heading", level: item.level === 3 ? 3 : 2, text: item.text }];
      if (item.type === "list" && Array.isArray(item.items)) return [{
        type: "list", ordered: item.ordered === true, items: item.items.filter((text): text is string => typeof text === "string"),
      }];
      if (item.type === "image") return [normalizeLegacyNode(item)!];
      return [];
    });
    return { version: 1, blocks };
  }

  const root = node(stored.root ?? value);
  const children = Array.isArray(root.children) ? root.children : [];
  return { version: 1, blocks: children.flatMap((child) => {
    const block = normalizeLegacyNode(child);
    return block ? [block] : [];
  }) };
}

export function articleBodyHasText(value: unknown): boolean {
  return normalizeArticleBody(value).blocks.some((block) => {
    if (block.type === "paragraph" || block.type === "heading") return block.text.trim().length > 0;
    return block.type === "list" && block.items.some((text) => text.trim().length > 0);
  });
}
