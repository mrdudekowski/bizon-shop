type LexicalContentProps = {
  data: unknown;
  className?: string;
  fallback?: string;
};

function isHtmlString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Stage 1: HTML string or fallback until frontend-cms defines a rich-text format. */
export function LexicalContent({
  data,
  className = "lexical-content",
  fallback,
}: LexicalContentProps) {
  if (isHtmlString(data)) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: data }} />;
  }

  return fallback ? <p className="info-card-text">{fallback}</p> : null;
}
