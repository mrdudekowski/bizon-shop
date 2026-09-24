export type BizonTbrCatalogEntry = {
  code: string;
  activeOnSite: boolean;
  tireIqEnabled: boolean;
};

/** Full TBR model contour from the BIZON source catalogue. */
export const BIZON_TBR_CATALOG_MANIFEST: readonly BizonTbrCatalogEntry[] = [
  { code: "DLA968", activeOnSite: false, tireIqEnabled: false },
  { code: "DSR266", activeOnSite: false, tireIqEnabled: false },
  { code: "DMS100", activeOnSite: false, tireIqEnabled: false },
  { code: "DSR08A", activeOnSite: false, tireIqEnabled: false },
  { code: "DLD816", activeOnSite: false, tireIqEnabled: false },
  { code: "DSR118", activeOnSite: false, tireIqEnabled: false },
  { code: "DLS918", activeOnSite: false, tireIqEnabled: false },
  { code: "DSR566", activeOnSite: false, tireIqEnabled: false },
  { code: "DLD815", activeOnSite: false, tireIqEnabled: false },
  { code: "DLD809", activeOnSite: false, tireIqEnabled: false },
  { code: "DWD100", activeOnSite: false, tireIqEnabled: false },
  { code: "D930", activeOnSite: false, tireIqEnabled: false },
  { code: "DMA808", activeOnSite: false, tireIqEnabled: false },
  { code: "DSRD22", activeOnSite: false, tireIqEnabled: false },
  { code: "D530", activeOnSite: false, tireIqEnabled: false },
  { code: "FIO628", activeOnSite: false, tireIqEnabled: false },
  { code: "DMA100", activeOnSite: false, tireIqEnabled: false },
  { code: "DMA805", activeOnSite: false, tireIqEnabled: false },
  { code: "DSR177", activeOnSite: true, tireIqEnabled: true },
  { code: "DSR830", activeOnSite: false, tireIqEnabled: false },
  { code: "DSR158", activeOnSite: true, tireIqEnabled: true },
  { code: "DSR188", activeOnSite: true, tireIqEnabled: true },
  { code: "TAX106", activeOnSite: false, tireIqEnabled: false },
  { code: "TTX108", activeOnSite: false, tireIqEnabled: false },
] as const;

export const BIZON_TBR_ACTIVE_CODES = BIZON_TBR_CATALOG_MANIFEST
  .filter((entry) => entry.activeOnSite)
  .map((entry) => entry.code);

export const BIZON_TBR_TIRE_IQ_CODES = BIZON_TBR_CATALOG_MANIFEST
  .filter((entry) => entry.tireIqEnabled)
  .map((entry) => entry.code);
