import { HONEYPOT_FIELD } from "./validateRequest";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/yandexMetrika";
import type { ApiRequestSuccess } from "./types";
import { publicApiUrl } from "@/lib/publicApi";

export type SubmitRequestOptions = {
  sourceForm: string;
  sourcePage?: string;
  body: Record<string, unknown>;
};

export async function submitRequest({ sourceForm, sourcePage, body }: SubmitRequestOptions): Promise<ApiRequestSuccess> {
  const endpoint = publicApiUrl("/v1/requests");
  if (!endpoint) throw new Error("Отправка заявок пока не настроена.");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      ...body,
      sourceForm,
      sourcePage,
      [HONEYPOT_FIELD]: "",
    }),
  });

  const data = (await response.json()) as {
    ok?: boolean;
    message?: string;
    error?: string;
  };

  if (!response.ok || !data.ok) {
    trackEvent(ANALYTICS_EVENTS.requestSubmitError, { sourceForm });
    throw new Error(data.message ?? "Request failed");
  }

  trackEvent(ANALYTICS_EVENTS.requestSubmitSuccess, { sourceForm });
  return data as ApiRequestSuccess;
}
