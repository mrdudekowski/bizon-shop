import { normalizeImageUrl } from "./mapTire";

export type ArticleBodyBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "image"; assetId: string | null; alt: string; caption: string };

export type ArticleBodyDocument = {
  version: 1;
  blocks: ArticleBodyBlock[];
};

type LexicalNode = {
  type?: unknown;
  text?: unknown;
  tag?: unknown;
  listType?: unknown;
  level?: unknown;
  assetId?: unknown;
  mediaId?: unknown;
  alt?: unknown;
  caption?: unknown;
  items?: unknown;
  ordered?: unknown;
  children?: unknown;
};

function record(value: unknown): LexicalNode {
  return value != null && typeof value === "object" ? value as LexicalNode : {};
}

function textContent(value: unknown): string {
  if (Array.isArray(value)) return value.map(textContent).join("");
  const node = record(value);
  if (typeof node.text === "string") return node.text;
  return textContent(node.children);
}

function imageBlock(value: unknown): ArticleBodyBlock {
  const node = record(value);
  const rawId = node.assetId ?? node.mediaId;
  const assetId = rawId == null || !/^\d+$/.test(String(rawId)) ? null : String(rawId);
  return {
    type: "image",
    assetId,
    alt: typeof node.alt === "string" ? node.alt : "",
    caption: typeof node.caption === "string" ? node.caption : "",
  };
}

function fromLexicalNode(value: unknown): ArticleBodyBlock | null {
  const node = record(value);
  const type = String(node.type ?? "");
  if (type === "articleImage" || type === "image") return imageBlock(node);
  if (type === "paragraph") return { type: "paragraph", text: textContent(node.children) };
  if (type === "heading") {
    return {
      type: "heading",
      level: node.tag === "h3" || node.level === 3 ? 3 : 2,
      text: textContent(node.children),
    };
  }
  if (type === "list") {
    const children = Array.isArray(node.children) ? node.children : [];
    return {
      type: "list",
      ordered: node.listType === "number" || node.listType === "ordered" || node.tag === "ol",
      items: children.map((item) => textContent(record(item).children)).filter((item) => item.length > 0),
    };
  }
  const text = textContent(node.children);
  return text ? { type: "paragraph", text } : null;
}

function normalizeBlock(value: unknown): ArticleBodyBlock | null {
  const node = record(value);
  if (node.type === "image") return imageBlock(node);
  if (node.type === "paragraph" || node.type === "heading" || node.type === "list") {
    return fromLexicalNode(node);
  }
  return fromLexicalNode(node);
}

export function normalizeArticleBody(value: unknown): ArticleBodyDocument {
  if (typeof value === "string") {
    return { version: 1, blocks: value ? [{ type: "paragraph", text: value }] : [] };
  }
  if (value == null || typeof value !== "object") return { version: 1, blocks: [] };

  const stored = value as { version?: unknown; blocks?: unknown; root?: unknown; children?: unknown };
  if (stored.version === 1 && Array.isArray(stored.blocks)) {
    const blocks = stored.blocks.flatMap((block): ArticleBodyBlock[] => {
      const node = record(block);
      if (node.type === "paragraph" && typeof node.text === "string") return [{ type: "paragraph", text: node.text }];
      if (node.type === "heading" && typeof node.text === "string") return [{ type: "heading", level: node.level === 3 ? 3 : 2, text: node.text }];
      const items = node.items;
      if (node.type === "list" && Array.isArray(items)) return [{
        type: "list",
        ordered: node.ordered === true,
        items: items.filter((item): item is string => typeof item === "string"),
      }];
      if (node.type === "image") return [imageBlock(node)];
      return [];
    });
    return { version: 1, blocks };
  }

  const root = record(stored.root ?? value);
  const children = Array.isArray(root.children) ? root.children : [];
  return { version: 1, blocks: children.flatMap((node) => {
    const block = normalizeBlock(node);
    return block ? [block] : [];
  }) };
}

export function articleBodyMediaIds(body: ArticleBodyDocument): string[] {
  return [...new Set(body.blocks.flatMap((block) => block.type === "image" && block.assetId ? [block.assetId] : []))];
}

export function articleBodyToLexical(value: unknown): unknown {
  const body = normalizeArticleBody(value);
  const children = body.blocks.map((block) => {
    if (block.type === "paragraph") return { type: "paragraph", children: [{ type: "text", text: block.text }] };
    if (block.type === "heading") return {
      type: "heading",
      tag: block.level === 3 ? "h3" : "h2",
      children: [{ type: "text", text: block.text }],
    };
    if (block.type === "list") return {
      type: "list",
      listType: block.ordered ? "number" : "bullet",
      tag: block.ordered ? "ol" : "ul",
      children: block.items.map((text) => ({ type: "listitem", children: [{ type: "text", text }] })),
    };
    return {
      type: "articleImage",
      assetId: block.assetId,
      alt: block.alt,
      caption: block.caption,
      children: [],
    };
  });
  return { root: { type: "root", children } };
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function safeImageUrl(value: string | undefined): string | null {
  if (!value) return null;
  const normalized = normalizeImageUrl(value);
  if (!normalized || normalized.startsWith("//")) return null;
  if (normalized.startsWith("/") || /^https?:\/\//i.test(normalized)) return normalized;
  return null;
}

export function articleBodyToHtml(value: unknown, mediaById: Readonly<Record<string, string>> = {}): string {
  return normalizeArticleBody(value).blocks.map((block) => {
    if (block.type === "paragraph") return block.text ? `<p>${escapeHtml(block.text)}</p>` : "";
    if (block.type === "heading") {
      const tag = block.level === 3 ? "h3" : "h2";
      return block.text ? `<${tag}>${escapeHtml(block.text)}</${tag}>` : "";
    }
    if (block.type === "list") {
      const tag = block.ordered ? "ol" : "ul";
      const items = block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
      return items ? `<${tag}>${items}</${tag}>` : "";
    }
    const imageUrl = block.assetId ? safeImageUrl(mediaById[block.assetId]) : null;
    const image = imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(block.alt)}" loading="lazy">` : "";
    const caption = block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : "";
    return image || caption ? `<figure>${image}${caption}</figure>` : "";
  }).filter(Boolean).join("");
}

export function articleBodyHasText(value: unknown): boolean {
  return normalizeArticleBody(value).blocks.some((block) => {
    if (block.type === "paragraph" || block.type === "heading") return block.text.trim().length > 0;
    if (block.type === "list") return block.items.some((item) => item.trim().length > 0);
    return false;
  });
}
