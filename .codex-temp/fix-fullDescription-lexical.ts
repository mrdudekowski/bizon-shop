import { getPayload } from "../src/lib/payload/getPayload";

function plainTextToLexical(text: string) {
  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr" as const,
      children: [
        {
          type: "paragraph",
          format: "",
          indent: 0,
          version: 1,
          direction: "ltr" as const,
          textStyle: "",
          textFormat: 0,
          children: text
            ? [
                {
                  type: "text",
                  detail: 0,
                  format: 0,
                  mode: "normal" as const,
                  style: "",
                  version: 1,
                  text,
                },
              ]
            : [],
        },
      ],
    },
  };
}

function lexicalPlainText(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object" || !("root" in value)) return null;

  const parts: string[] = [];
  const walk = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    if ("text" in node && typeof (node as { text: unknown }).text === "string") {
      parts.push((node as { text: string }).text);
    }
    const children = (node as { children?: unknown }).children;
    if (Array.isArray(children)) {
      for (const child of children) walk(child);
    }
  };
  walk((value as { root: unknown }).root);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function isBrokenLexical(value: unknown): boolean {
  if (typeof value === "string") return true;
  if (!value || typeof value !== "object" || !("root" in value)) return false;
  const root = (value as { root?: { children?: unknown } }).root;
  if (!root || !Array.isArray(root.children)) return true;
  return root.children.some(
    (child) =>
      child &&
      typeof child === "object" &&
      "children" in child &&
      !Array.isArray((child as { children: unknown }).children),
  );
}

const payload = await getPayload();
const result = await payload.find({
  collection: "tire-models",
  limit: 200,
  depth: 0,
  overrideAccess: true,
});

let fixed = 0;
for (const doc of result.docs) {
  if (!isBrokenLexical(doc.fullDescription)) continue;
  const text = lexicalPlainText(doc.fullDescription) ?? "";
  await payload.update({
    collection: "tire-models",
    id: doc.id,
    data: {
      fullDescription: text ? plainTextToLexical(text) : plainTextToLexical(""),
    },
    overrideAccess: true,
  });
  fixed += 1;
  console.log(`fixed id=${doc.id} slug=${doc.slug} textLen=${text.length}`);
}

console.log(`done fixed=${fixed}`);
process.exit(0);
