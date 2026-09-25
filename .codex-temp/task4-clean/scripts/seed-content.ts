import { getPayload } from "../src/lib/payload/getPayload";
import type { Payload } from "payload";

function richTextParagraph(text: string) {
  return {
    root: {
      type: "root" as const,
      format: "" as const,
      indent: 0,
      version: 1,
      direction: "ltr" as const,
      children: [
        {
          type: "paragraph" as const,
          format: "" as const,
          indent: 0,
          version: 1,
          direction: "ltr" as const,
          children: [
            {
              type: "text" as const,
              detail: 0,
              format: 0,
              mode: "normal" as const,
              style: "",
              text,
              version: 1,
            },
          ],
        },
      ],
    },
  };
}

function richTextHeading(text: string) {
  return {
    type: "heading" as const,
    tag: "h2" as const,
    format: "" as const,
    indent: 0,
    version: 1,
    direction: "ltr" as const,
    children: [
      {
        type: "text" as const,
        detail: 0,
        format: 0,
        mode: "normal" as const,
        style: "",
        text,
        version: 1,
      },
    ],
  };
}

function richTextList(items: string[]) {
  return {
    type: "list" as const,
    listType: "bullet" as const,
    format: "" as const,
    indent: 0,
    version: 1,
    direction: "ltr" as const,
    start: 1,
    tag: "ul" as const,
    children: items.map((item) => ({
      type: "listitem" as const,
      format: "" as const,
      indent: 0,
      version: 1,
      direction: "ltr" as const,
      value: 1,
      children: [
        {
          type: "paragraph" as const,
          format: "" as const,
          indent: 0,
          version: 1,
          direction: "ltr" as const,
          children: [
            {
              type: "text" as const,
              detail: 0,
              format: 0,
              mode: "normal" as const,
              style: "",
              text: item,
              version: 1,
            },
          ],
        },
      ],
    })),
  };
}

function richTextDocument(blocks: unknown[]) {
  const children = blocks.flatMap((block) => {
    if (block && typeof block === "object" && "root" in block) {
      const root = (block as { root: { children: unknown[] } }).root;
      return root.children;
    }
    return [block];
  });

  return {
    root: {
      type: "root" as const,
      format: "" as const,
      indent: 0,
      version: 1,
      direction: "ltr" as const,
      children,
    },
  };
}

const ARTICLE_SEEDS = [
  {
    slug: "tire-pressure-fleet",
    title: "Давление в шинах: чек-лист для автопарка",
    excerpt: "Как снизить износ и простои за счёт регулярного контроля давления.",
    content: richTextDocument([
      richTextParagraph(
        "Регулярная проверка давления — самый дешёвый способ продлить ресурс TBR. Фиксируйте показания при одной температуре, ведите журнал по осям и сверяйте с рекомендациями производителя.",
      ),
      richTextHeading("Минимальный регламент"),
      richTextList([
        "Проверка холодных шин перед выездом и после стоянки",
        "Единый журнал по осям и прицепам",
        "Сверка с таблицей производителя для каждой оси",
      ]),
    ]),
  },
  {
    slug: "otr-tread-selection",
    title: "Выбор протектора для OTR",
    excerpt: "Когда нужен глубокий блок, а когда — универсальный рисунок.",
    content: richTextParagraph(
      "Для карьерных условий важны глубина протектора и устойчивость к порезам. Для смешанных маршрутов выбирайте универсальный рисунок с балансом сцепления и износостойкости.",
    ),
  },
];

const STORY_SEEDS = [
  {
    slug: "north-logistics-fleet",
    title: "Северный автопарк сократил простои на 18%",
    excerpt: "Переход на DOUBLESTAR TBR и регламент давления.",
    clientName: "North Logistics",
    industry: "Логистика",
    content: richTextParagraph(
      "После внедрения еженедельного контроля давления и унификации размеров по осям автопарк сократил внеплановые остановки и стабилизировал расход резины на маршрутах дальнего следования.",
    ),
  },
];

console.log("seed-content: connecting…");
const payload = await getPayload();

for (const seed of ARTICLE_SEEDS) {
  const existing = await payload.find({
    collection: "tire-iq-articles",
    where: { slug: { equals: seed.slug } },
    limit: 1,
    depth: 0,
  });

  const data = {
    title: seed.title,
    slug: seed.slug,
    excerpt: seed.excerpt,
    content: seed.content,
    status: "published" as const,
    publishedAt: new Date().toISOString(),
  };

  if (existing.docs[0]) {
    await payload.update({
      collection: "tire-iq-articles",
      id: existing.docs[0].id,
      data,
    } as Parameters<Payload["update"]>[0]);
    console.log(`Updated tire-iq-articles: ${seed.slug}`);
  } else {
    await payload.create({ collection: "tire-iq-articles", data } as Parameters<Payload["create"]>[0]);
    console.log(`Created tire-iq-articles: ${seed.slug}`);
  }
}

for (const seed of STORY_SEEDS) {
  const existing = await payload.find({
    collection: "people-stories",
    where: { slug: { equals: seed.slug } },
    limit: 1,
    depth: 0,
  });

  const data = {
    title: seed.title,
    slug: seed.slug,
    excerpt: seed.excerpt,
    clientName: seed.clientName,
    industry: seed.industry,
    content: seed.content,
    status: "published" as const,
    publishedAt: new Date().toISOString(),
  };

  if (existing.docs[0]) {
    await payload.update({
      collection: "people-stories",
      id: existing.docs[0].id,
      data,
    } as Parameters<Payload["update"]>[0]);
    console.log(`Updated people-stories: ${seed.slug}`);
  } else {
    await payload.create({ collection: "people-stories", data } as Parameters<Payload["create"]>[0]);
    console.log(`Created people-stories: ${seed.slug}`);
  }
}

console.log("Done.");
process.exit(0);
