import { setPublishedAt } from "@/payload/hooks/setPublishedAt";
import {
  revalidateSiteCache,
  revalidateSiteCacheAfterDelete,
} from "@/payload/hooks/revalidateSiteCache";

export const catalogContentHooks = {
  beforeChange: [setPublishedAt],
  afterChange: [revalidateSiteCache],
  afterDelete: [revalidateSiteCacheAfterDelete],
};
