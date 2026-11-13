type LexicalContentProps = {
  data: unknown;
  className?: string;
  fallback?: string;
};

function isHtmlString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

const BIZON_TOKEN = /(?<![\p{L}\p{N}_])BIZON(?![\p{L}\p{N}_])/giu;

function emphasizeText(value: string): string {
  return value.replace(BIZON_TOKEN, (match) => `<strong class="bizon-word-emphasis">${match}</strong>`);
}

/** Transform HTML text nodes only; preserve tags and attributes verbatim. */
export function emphasizeBizonHtml(value: string): string {
  let output = "";
  let cursor = 0;
  const elementStack: Array<{ tag: string; suppressed: boolean }> = [];
  const voidTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);

  while (cursor < value.length) {
    if (value.startsWith("<!--", cursor)) {
      const commentEnd = value.indexOf("-->", cursor + 4);
      const end = commentEnd === -1 ? value.length : commentEnd + 3;
      output += value.slice(cursor, end);
      cursor = end;
      continue;
    }

    const tagStart = value.indexOf("<", cursor);
    const textEnd = tagStart === -1 ? value.length : tagStart;
    if (!elementStack.some((element) => element.suppressed)) output += emphasizeText(value.slice(cursor, textEnd));
    else output += value.slice(cursor, textEnd);
    if (tagStart === -1) break;

    let tagEnd = tagStart + 1;
    let quote = "";
    while (tagEnd < value.length) {
      const char = value[tagEnd];
      if (quote) {
        if (char === quote) quote = "";
      } else if (char === "\"" || char === "'") {
        quote = char;
      } else if (char === ">") {
        break;
      }
      tagEnd += 1;
    }

    const rawTag = value.slice(tagStart, Math.min(tagEnd + 1, value.length));
    output += rawTag;
    cursor = Math.min(tagEnd + 1, value.length);
    if (/^<!--/.test(rawTag) || /^<!|^<\?/.test(rawTag)) continue;

    const parsed = rawTag.match(/^<\s*(\/)?\s*([a-z][\w:-]*)\b/i);
    if (!parsed) continue;
    const closing = Boolean(parsed[1]);
    const tag = parsed[2].toLowerCase();
    const isVoid = voidTags.has(tag) || /\/\s*>$/.test(rawTag);
    const markedFooter = tag === "footer" && /\bdata-site-footer(?:\s|=|>)/i.test(rawTag);
    const hiddenMarkup =
      /\shidden(?:\s|=|>)/i.test(rawTag) ||
      /\saria-hidden\s*=\s*(['"])true\1/i.test(rawTag) ||
      /\sstyle\s*=\s*(['"])[^'"]*(?:display\s*:\s*none|visibility\s*:\s*hidden)[^'"]*\1/i.test(rawTag) ||
      /\bclass\s*=\s*(['"])[^'"]*(?:sr-only|screen-reader-only|visually-hidden|visuallyHidden)[^'"]*\1/i.test(rawTag);
    const suppress = ["script", "style", "textarea", "title", "template", "svg", "noscript", "b", "strong"].includes(tag) || markedFooter || hiddenMarkup;

    if (closing) {
      const index = elementStack.map((element) => element.tag).lastIndexOf(tag);
      if (index !== -1) {
        elementStack.splice(index);
      }
    } else if (!isVoid) {
      elementStack.push({
        tag,
        suppressed: suppress || elementStack.some((element) => element.suppressed),
      });
    }
  }

  return output;
}

/** Stage 1: HTML string or fallback until frontend-cms defines a rich-text format. */
export function LexicalContent({
  data,
  className = "lexical-content",
  fallback,
}: LexicalContentProps) {
  if (isHtmlString(data)) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: emphasizeBizonHtml(data) }} />;
  }

  return fallback ? <p className="info-card-text">{fallback}</p> : null;
}
