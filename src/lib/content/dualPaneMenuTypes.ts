export type DualPaneItem = {
  id: string;
  title: string;
  href: string;
  imageUrl?: string | null;
  pills?: string[];
  description?: string;
};

export type DualPaneSection = {
  id: string;
  label: string;
  pane: "gallery" | "list";
  items: DualPaneItem[];
  footerLink?: { label: string; href: string };
};

export type DualPaneMenuData = {
  defaultSectionId: string;
  sections: DualPaneSection[];
};
