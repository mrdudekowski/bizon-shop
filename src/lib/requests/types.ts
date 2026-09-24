import type { RequestItemInput, RequestItemType, SourceForm } from "@/types/requestItem";
import type { NormalizedSelectionContext } from "./selectionContext";

export type { RequestItem, RequestItemInput, RequestItemType, SourceForm } from "@/types/requestItem";
export { isRequestItemType, isSourceForm } from "@/types/requestItem";

export type IncomingRequestBody = {
  clientType?: "individual" | "company" | string | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  companyName?: string | null;
  inn?: string | null;
  position?: string | null;
  purchaseVolume?: string | null;
  preferredContact?: string | null;
  message?: string | null;
  selectionContext?: unknown;
  items?: RequestItemInput[] | null;
  sourcePage?: string | null;
  sourceForm?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  /** Honeypot — must stay empty */
  website?: string | null;
};

export type NormalizedRequestItem = {
  itemType: RequestItemType;
  tireModel?: number;
  tireVariant?: number;
  wheelModel?: number;
  wheelVariant?: number;
  product?: number;
  itemName: string;
  itemSlug?: string;
  parentSlug?: string;
  variantLabel?: string;
  quantity: number;
  url?: string;
  notes?: string;
  priceOnRequest: boolean;
};

export type NormalizedRequest = {
  clientType: "individual" | "company";
  name: string;
  phone?: string;
  email?: string;
  city?: string;
  companyName?: string;
  inn?: string;
  position?: string;
  purchaseVolume?: string;
  preferredContact?: "phone" | "email" | "telegram" | "whatsapp";
  message?: string;
  selectionContext?: NormalizedSelectionContext;
  items: NormalizedRequestItem[];
  sourcePage?: string;
  sourceForm: SourceForm;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  sourceIpHash?: string;
  userAgent?: string;
};

export type RequestValidationError =
  | "invalid_request_body"
  | "honeypot_triggered"
  | "missing_required_fields"
  | "duplicate_request";

export type ApiRequestSuccess = {
  ok: true;
  requestId: string | number;
  message: string;
};

export type ApiRequestError = {
  ok: false;
  error:
    | RequestValidationError
    | "request_create_failed"
    | "unexpected_error"
    | "rate_limit_exceeded";
  message: string;
};
