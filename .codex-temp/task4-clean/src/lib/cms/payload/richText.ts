/** Extract plain text from Payload Lexical rich text JSON for page display. */
export function lexicalToPlainText(value: unknown): string {
  if (!value || typeof value !== "object") return "";

  const root =
    "root" in value && (value as { root?: unknown }).root
      ? (value as { root: unknown }).root
      : value;

  const parts: string[] = [];

  const walk = (node: unknown): void => {
    if (!node || typeof node !== "object") return;

    if ("text" in node && typeof (node as { text: unknown }).text === "string") {
      parts.push((node as { text: string }).text);
    }

    if ("children" in node && Array.isArray((node as { children: unknown }).children)) {
      for (const child of (node as { children: unknown[] }).children) {
        walk(child);
      }
    }
  };

  walk(root);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export function isLexicalContent(
  value: unknown,
): value is { root: Record<string, unknown> } {
  return Boolean(value && typeof value === "object" && "root" in value && (value as { root?: unknown }).root);
}

export function formatPublishedDate(value?: string | null): string {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toISOString().slice(0, 10);
}
