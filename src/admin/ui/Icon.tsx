import type { CSSProperties } from "react";

export type IconName = "tires" | "directions" | "wheels" | "shop" | "pages" | "materials" | "users" | "publications" | "arrow" | "plus" | "image" | "trash" | "more";
const paths: Record<IconName, string> = {
  tires: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM6 5l2 3m8 8 2 3M3 12h4m10 0h4M6 19l2-3m8-8 2-3",
  directions: "m12 3 8 9-8 9-8-9 8-9Zm0 14V8m-3 3 3-3 3 3",
  wheels: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm0-6v6m0 6v6M3 12h6m6 0h6",
  shop: "M4 8h16l-1 13H5L4 8Zm4 0V6a4 4 0 0 1 8 0v2",
  pages: "M6 3h8l4 4v14H6V3Zm8 0v5h4M9 12h6m-6 4h6",
  materials: "M4 4h16v16H4V4Zm4 4h3v4H8V8Zm6 0h3m-3 4h3m-9 4h9",
  users: "M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21v-2a7 7 0 0 1 14 0v2M17 4a4 4 0 0 1 0 8m1 3a5 5 0 0 1 4 5v1",
  publications: "M5 4h14v16H5V4Zm3 4h8M8 12h8M8 16h5",
  arrow: "m9 5 7 7-7 7", plus: "M12 5v14M5 12h14", image: "M3 4h18v16H3V4Zm0 12 5-5 5 5 3-3 5 5M15 8h.01",
  trash: "M3 6h18m-2 0-1 14H6L5 6m4 0V4h6v2m-5 4v7m4-7v7",
  more: "M6 12h.01M12 12h.01M18 12h.01",
};
export function Icon({ name, size = 20, style, className }: { name: IconName; size?: number; style?: CSSProperties; className?: string }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}><path d={paths[name]} /></svg>;
}
