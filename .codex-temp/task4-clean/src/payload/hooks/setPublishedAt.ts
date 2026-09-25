import type { CollectionBeforeChangeHook } from "payload";

export const setPublishedAt: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if (
    data?.status === "published" &&
    originalDoc?.status !== "published" &&
    !data.publishedAt
  ) {
    data.publishedAt = new Date().toISOString();
  }

  return data;
};
