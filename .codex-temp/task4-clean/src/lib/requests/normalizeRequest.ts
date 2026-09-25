import { createHash } from "node:crypto";

import { toCatalogItemRelation, toCatalogVariantRelation } from "./requestCatalogItem";

import type {
  IncomingRequestBody,
  NormalizedRequest,
  NormalizedRequestItem,
  RequestItemType,
  SourceForm,
} from "./types";
import { isRequestItemType, isSourceForm } from "./types";

function cleanString(value: unknown, maxLength = 500): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}

function parseNumericId(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return undefined;
}

function inferItemType(item: NonNullable<IncomingRequestBody["items"]>[number]): RequestItemType {
  if (isRequestItemType(item.itemType)) return item.itemType;
  if (item.productId != null) return "shopProduct";
  const url = cleanString(item.url, 300) ?? "";
  if (url.startsWith("/models/")) return "tire";
  if (url.startsWith("/shop/wheels/")) return "wheel";
  return "shopProduct";
}

function inferSlugFromUrl(url: string | undefined, itemType: RequestItemType): string | undefined {
  if (!url) return undefined;
  const parts = url.split("/").filter(Boolean);
  if (itemType === "tire" && parts[0] === "models" && parts.length >= 3) return parts[2];
  if (itemType === "wheel" && parts[0] === "shop" && parts[1] === "wheels" && parts.length >= 4) {
    return parts[3];
  }
  if (itemType === "shopProduct" && parts[0] === "shop" && parts[1] === "product" && parts[2]) {
    return parts[2];
  }
  return undefined;
}

function inferParentSlugFromUrl(url: string | undefined, itemType: RequestItemType): string | undefined {
  if (!url) return undefined;
  const parts = url.split("/").filter(Boolean);
  if (itemType === "tire" && parts[0] === "models" && parts[1]) return parts[1];
  if (itemType === "wheel" && parts[0] === "shop" && parts[1] === "wheels" && parts[2]) {
    return parts[2];
  }
  if (itemType === "shopProduct" && parts[0] === "shop" && parts[1] && parts[1] !== "product") {
    return parts[1];
  }
  return undefined;
}

function normalizeItems(body: IncomingRequestBody): NormalizedRequestItem[] {
  if (!Array.isArray(body.items)) return [];

  return body.items
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const itemType = inferItemType(item);
      const url = cleanString(item.url, 300);
      const itemName =
        cleanString(item.name, 200) ??
        cleanString(item.title, 200) ??
        cleanString(item.slug, 200) ??
        cleanString(item.productId, 200);
      const itemSlug =
        cleanString(item.slug, 120) ?? inferSlugFromUrl(url, itemType) ?? undefined;
      const parentSlug =
        cleanString(item.parentSlug, 120) ?? inferParentSlugFromUrl(url, itemType) ?? undefined;
      const variantLabel = cleanString(item.variantLabel, 120) ?? cleanString(item.size, 120);
      const quantity =
        typeof item.quantity === "number" && item.quantity > 0
          ? Math.min(Math.round(item.quantity), 99999)
          : 1;

      const modelId = parseNumericId(item.itemId) ?? parseNumericId(item.productId);
      const variantId = parseNumericId(item.variantId);

      if (!itemName && !modelId) return null;

      const normalized: NormalizedRequestItem = {
        itemType,
        itemName: itemName ?? `item-${modelId ?? "unknown"}`,
        itemSlug,
        parentSlug,
        variantLabel,
        quantity,
        url,
        notes: cleanString(item.notes, 300),
        priceOnRequest: item.priceOnRequest !== false,
      };

      if (itemType === "tire") {
        if (modelId) normalized.tireModel = modelId;
        if (variantId) normalized.tireVariant = variantId;
      } else if (itemType === "wheel") {
        if (modelId) normalized.wheelModel = modelId;
        if (variantId) normalized.wheelVariant = variantId;
      } else if (modelId) {
        normalized.product = modelId;
      }

      return normalized;
    })
    .filter((item): item is NormalizedRequestItem => Boolean(item));
}

export function hashSourceIp(ip: string | null | undefined): string | undefined {
  if (!ip?.trim()) return undefined;
  return createHash("sha256").update(ip.trim()).digest("hex");
}

function normalizeSourceForm(value: unknown): SourceForm {
  const raw = cleanString(value, 40);
  if (raw && isSourceForm(raw)) return raw;
  return "custom";
}

function normalizeClientType(value: unknown): "individual" | "company" {
  return value === "company" ? "company" : "individual";
}

function normalizePreferredContact(
  value: unknown,
): NormalizedRequest["preferredContact"] | undefined {
  const raw = cleanString(value, 20);
  if (raw === "phone" || raw === "email" || raw === "telegram" || raw === "whatsapp") {
    return raw;
  }
  return undefined;
}

export function normalizeRequest(
  body: IncomingRequestBody,
  meta: { sourceIp?: string | null; userAgent?: string | null },
): NormalizedRequest {
  return {
    clientType: normalizeClientType(body.clientType),
    name: cleanString(body.name, 120)!,
    phone: cleanString(body.phone, 40),
    email: cleanString(body.email, 120),
    city: cleanString(body.city, 120),
    companyName: cleanString(body.companyName, 200),
    inn: cleanString(body.inn, 20),
    position: cleanString(body.position, 120),
    purchaseVolume: cleanString(body.purchaseVolume, 120),
    preferredContact: normalizePreferredContact(body.preferredContact),
    message: cleanString(body.message, 4000),
    items: normalizeItems(body),
    sourcePage: cleanString(body.sourcePage, 300),
    sourceForm: normalizeSourceForm(body.sourceForm),
    utmSource: cleanString(body.utmSource, 120),
    utmMedium: cleanString(body.utmMedium, 120),
    utmCampaign: cleanString(body.utmCampaign, 120),
    utmContent: cleanString(body.utmContent, 120),
    utmTerm: cleanString(body.utmTerm, 120),
    sourceIpHash: hashSourceIp(meta.sourceIp),
    userAgent: cleanString(meta.userAgent, 300),
  };
}

export function toPayloadRequestData(data: NormalizedRequest) {
  return {
    clientType: data.clientType,
    name: data.name,
    phone: data.phone,
    email: data.email,
    city: data.city,
    companyName: data.companyName,
    inn: data.inn,
    position: data.position,
    purchaseVolume: data.purchaseVolume,
    preferredContact: data.preferredContact,
    message: data.message,
    items: data.items.map((item) => ({
      itemType: item.itemType,
      catalogItem: toCatalogItemRelation(item),
      catalogVariant: toCatalogVariantRelation(item),
      itemName: item.itemName,
      itemSlug: item.itemSlug,
      parentSlug: item.parentSlug,
      variantLabel: item.variantLabel,
      quantity: item.quantity,
      url: item.url,
      notes: item.notes,
      priceOnRequest: item.priceOnRequest,
    })),
    sourcePage: data.sourcePage,
    sourceForm: data.sourceForm,
    utmSource: data.utmSource,
    utmMedium: data.utmMedium,
    utmCampaign: data.utmCampaign,
    utmContent: data.utmContent,
    utmTerm: data.utmTerm,
    sourceIpHash: data.sourceIpHash,
    userAgent: data.userAgent,
    status: "new" as const,
    notificationStatus: "pending" as const,
  };
}

/** ponytail: smallest check that fails if item normalization breaks */
export function selfCheckRequestItems(): void {
  const items = normalizeItems({
    items: [
      {
        itemType: "tire",
        itemId: "10",
        variantId: "20",
        name: "DSR158",
        slug: "dsr158",
        parentSlug: "tbr",
        variantLabel: "12.00R20",
        url: "/models/tbr/dsr158",
      },
      {
        itemType: "wheel",
        itemId: "3",
        variantId: "7",
        name: "BIZON Forged Pro",
        slug: "bizon-forged-pro",
        variantLabel: "22.5×8.25",
        url: "/shop/wheels/forged/bizon-forged-pro",
      },
      { title: "BIZON Cap", url: "/shop/product/bizon-cap", productId: "5" },
    ],
  });

  if (items.length !== 3) throw new Error("selfCheckRequestItems: expected 3 items");
  if (items[0]?.itemType !== "tire" || items[0]?.tireVariant !== 20) {
    throw new Error("selfCheckRequestItems: tire item");
  }
  if (items[1]?.wheelModel !== 3) throw new Error("selfCheckRequestItems: wheel item");
  if (items[2]?.itemType !== "shopProduct" || items[2]?.product !== 5) {
    throw new Error("selfCheckRequestItems: legacy shop item");
  }

  const payloadItems = toPayloadRequestData({
    clientType: "individual",
    name: "Test",
    items,
    sourceForm: "contact",
  }).items;

  if (payloadItems[0]?.catalogItem?.relationTo !== "tire-models") {
    throw new Error("selfCheckRequestItems: catalogItem tire");
  }
  if (payloadItems[0]?.catalogVariant?.relationTo !== "tire-variants") {
    throw new Error("selfCheckRequestItems: catalogVariant tire");
  }
}
