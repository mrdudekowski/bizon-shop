import type { MediaListItem, MediaUsageRecord, MediaUsageState } from "@/admin/domain/types";

export type MediaUsageFilter = {
  topLevelKey?: string;
  pageKey?: string;
  placementKey?: string;
  state?: MediaUsageState | "unused";
};

export type MediaUsageOption = { key: string; label: string };

export type MediaUsageOptions = {
  topLevels: MediaUsageOption[];
  pages: MediaUsageOption[];
  placements: MediaUsageOption[];
};

function usagesOf(asset: MediaListItem): MediaUsageRecord[] {
  return asset.usages ?? [];
}

function usageMatches(usage: MediaUsageRecord, filter: MediaUsageFilter): boolean {
  return (!filter.topLevelKey || usage.topLevelKey === filter.topLevelKey)
    && (!filter.pageKey || usage.pageKey === filter.pageKey)
    && (!filter.placementKey || usage.placementKey === filter.placementKey)
    && (!filter.state || filter.state === "unused" || usage.state === filter.state);
}

function optionsFor<T extends { key: string; label: string }>(items: T[]): MediaUsageOption[] {
  const unique = new Map<string, string>();
  for (const item of items) unique.set(item.key, item.label);
  return [...unique].map(([key, label]) => ({ key, label })).sort((a, b) => a.label.localeCompare(b.label, "ru"));
}

export function getMediaUsageOptions(
  assets: MediaListItem[],
  parentFilter: Pick<MediaUsageFilter, "topLevelKey" | "pageKey" | "state"> = {},
): MediaUsageOptions {
  const usages = assets.flatMap(usagesOf);
  const stateMatches = (usage: MediaUsageRecord) => !parentFilter.state
    || parentFilter.state === "unused"
    || usage.state === parentFilter.state;
  const matchingTopLevels = usages.filter(stateMatches);
  const matchingPages = usages.filter((usage) => stateMatches(usage)
    && (!parentFilter.topLevelKey || usage.topLevelKey === parentFilter.topLevelKey));
  const matchingPlacements = parentFilter.pageKey == null ? [] : usages.filter((usage) => stateMatches(usage)
    && (!parentFilter.topLevelKey || usage.topLevelKey === parentFilter.topLevelKey)
    && usage.pageKey === parentFilter.pageKey);

  return {
    topLevels: optionsFor(matchingTopLevels.map((usage) => ({ key: usage.topLevelKey, label: usage.topLevelLabel }))),
    pages: optionsFor(matchingPages.map((usage) => ({ key: usage.pageKey, label: usage.pageLabel }))),
    placements: optionsFor(matchingPlacements.map((usage) => ({ key: usage.placementKey, label: usage.placementLabel }))),
  };
}

export function filterAssetsByUsage(assets: MediaListItem[], filter: MediaUsageFilter = {}): MediaListItem[] {
  if (filter.state === "unused") return assets.filter((asset) => asset.usages?.length === 0);

  const hasPlacementFilter = Boolean(filter.topLevelKey || filter.pageKey || filter.placementKey || filter.state);
  if (!hasPlacementFilter) return assets;

  return assets.filter((asset) => usagesOf(asset).some((usage) => usageMatches(usage, filter)));
}
