import type { TireCategory } from "@/lib/catalog/tireCategories";

export type DualPaneItem = {
  id: string;
  title: string;
  href: string;
  navIcon?: "home" | "tire" | "catalog";
  imageUrl?: string | null;
  /** Catalog icon for a shop category. Resolved by the catalog, not chosen in the menu. */
  iconUrl?: string | null;
  pills?: string[];
  /** Tire application categories assigned to this model in the catalog. */
  applications?: TireCategory[];
  description?: string;
  advantages?: Array<{ key: string; title: string }>;
};

export type DualPaneSection = {
  id: string;
  label: string;
  href?: string;
  pane: "gallery" | "list";
  items: DualPaneItem[];
  footerLink?: { label: string; href: string };
};

export type DualPaneMenuData = {
  defaultSectionId: string;
  sections: DualPaneSection[];
};
