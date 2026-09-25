import type { CollectionSlug, Payload, Where } from "payload";

import { getPayload } from "@/lib/payload/getPayload";

type PayloadFindOptions = Parameters<Payload["find"]>[0];

export const PUBLISHED_STATUS_WHERE: Where = {
  status: { equals: "published" },
};

export async function withPayload<T>(query: (payload: Payload) => Promise<T>): Promise<T | null> {
  try {
    const payload = await getPayload();
    return await query(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[cms] Payload unavailable: ${message}`);
    return null;
  }
}

export async function findPublished<T extends CollectionSlug>(
  collection: T,
  options: Omit<PayloadFindOptions, "collection"> = {},
) {
  return withPayload(async (payload) => {
    const { where: extraWhere, ...rest } = options;
    const where =
      extraWhere && Object.keys(extraWhere).length > 0
        ? { and: [PUBLISHED_STATUS_WHERE, extraWhere] }
        : PUBLISHED_STATUS_WHERE;

    // ponytail: CollectionSlug union exceeds TS inference limit — cast at query boundary
    const result = await payload.find({
      collection,
      where,
      limit: 500,
      depth: 1,
      sort: "-updatedAt",
      ...rest,
    } as PayloadFindOptions);

    return result.docs;
  });
}

export async function findPublishedBySlug<T extends CollectionSlug>(
  collection: T,
  slug: string,
) {
  const normalized = slug?.trim().toLowerCase();
  if (!normalized) return null;

  return withPayload(async (payload) => {
    const result = await payload.find({
      collection,
      where: {
        and: [PUBLISHED_STATUS_WHERE, { slug: { equals: normalized } }],
      },
      limit: 1,
      depth: 1,
    } as PayloadFindOptions);

    return result.docs[0] ?? null;
  });
}

export async function findPublishedSlugs(collection: CollectionSlug): Promise<string[] | null> {
  return withPayload(async (payload) => {
    const result = await payload.find({
      collection,
      where: PUBLISHED_STATUS_WHERE,
      limit: 500,
      depth: 0,
      select: { slug: true },
    } as PayloadFindOptions);

    return result.docs
      .map((doc) => ("slug" in doc && typeof doc.slug === "string" ? doc.slug : null))
      .filter((value): value is string => Boolean(value));
  });
}
