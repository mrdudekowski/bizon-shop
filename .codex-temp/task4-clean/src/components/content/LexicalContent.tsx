import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import type { SerializedEditorState } from "lexical";

import { isLexicalContent } from "@/lib/cms/payload/richText";

type LexicalContentProps = {
  data: unknown;
  className?: string;
  fallback?: string;
};

export function LexicalContent({ data, className = "lexical-content", fallback }: LexicalContentProps) {
  if (!isLexicalContent(data)) {
    return fallback ? <p className="info-card-text">{fallback}</p> : null;
  }

  const html = convertLexicalToHTML({
    data: data as SerializedEditorState,
    disableContainer: true,
  });

  if (!html.trim()) {
    return fallback ? <p className="info-card-text">{fallback}</p> : null;
  }

  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
