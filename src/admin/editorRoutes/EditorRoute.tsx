"use client";

import { useSearchParams } from "next/navigation";

import { MaterialEditor } from "@/admin/materials/MaterialEditor";
import { PageEditor } from "@/admin/pages/PageEditor";
import { PublicationDetail } from "@/admin/publications/PublicationDetail";
import { ShopCategoryEditor } from "@/admin/shop/ShopCategoryEditor";
import { ShopProductEditor } from "@/admin/shop/ShopProductEditor";
import { TireDirectionEditor } from "@/admin/tires/TireDirectionEditor";
import { TireModelEditor } from "@/admin/tires/TireModelEditor";
import { WheelModelEditor } from "@/admin/wheels/WheelModelEditor";
import { WheelTypeEditor } from "@/admin/wheels/WheelTypeEditor";
import { PAGE_KEYS, type PageKey } from "@/admin/domain/types";

export type EditorRouteKind =
  | "material"
  | "page"
  | "publication"
  | "shop-category"
  | "shop-product"
  | "tire-direction"
  | "tire-model"
  | "wheel-model"
  | "wheel-type";

export function EditorRoute({ kind }: { kind: EditorRouteKind }) {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const pageKey = params.get("key") ?? "";

  if (kind === "page") {
    return PAGE_KEYS.includes(pageKey as PageKey)
      ? <PageEditor pageKey={pageKey as PageKey} />
      : <p>Не выбрана страница для редактирования.</p>;
  }
  if (!id) return <p>Не выбран материал для редактирования.</p>;

  switch (kind) {
    case "material": return <MaterialEditor id={id} />;
    case "publication": return <PublicationDetail id={id} />;
    case "shop-category": return <ShopCategoryEditor id={id} />;
    case "shop-product": return <ShopProductEditor id={id} />;
    case "tire-direction": return <TireDirectionEditor id={id} />;
    case "tire-model": return <TireModelEditor id={id} />;
    case "wheel-model": return <WheelModelEditor id={id} />;
    case "wheel-type": return <WheelTypeEditor id={id} />;
  }
}
