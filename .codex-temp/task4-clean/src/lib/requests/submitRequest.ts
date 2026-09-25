import { HONEYPOT_FIELD } from "./validateRequest";

export type SubmitRequestOptions = {
  sourceForm: string;
  sourcePage?: string;
  body: Record<string, unknown>;
};

export async function submitRequest({ sourceForm, sourcePage, body }: SubmitRequestOptions) {
  const response = await fetch("/api/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
    throw new Error(data.message ?? "Request failed");
  }

  return data;
}
