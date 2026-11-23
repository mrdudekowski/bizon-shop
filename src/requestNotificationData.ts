import { isConfiguredSourceForm, loadPageForm, PAGE_KEY_BY_SOURCE_FORM } from "./content/pageForm";
import type { RequestEmailData } from "./requestEmail";

export type RequestNotificationQuery = (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;

export async function loadRequestNotificationData(
  query: RequestNotificationQuery,
  requestId: number,
): Promise<RequestEmailData | null> {
  const [request] = await query("SELECT * FROM requests WHERE id = $1", [requestId]);
  if (!request) return null;
  const items = await query("SELECT * FROM requests_items WHERE _parent_id = $1 ORDER BY _order, id", [requestId]);
  const data: RequestEmailData = { ...request, items } as RequestEmailData;
  const rawAnswers = request.form_answers;
  const hasAnswers = typeof rawAnswers === "string"
    ? rawAnswers.trim().length > 0
    : rawAnswers != null && typeof rawAnswers === "object" && !Array.isArray(rawAnswers) && Object.keys(rawAnswers).length > 0;

  if (hasAnswers && isConfiguredSourceForm(request.source_form)) {
    try {
      const form = await loadPageForm({ query }, PAGE_KEY_BY_SOURCE_FORM[request.source_form]);
      if (form?.fields.length) {
        data.form_answer_labels = Object.fromEntries(form.fields.map(({ id, label }) => [id, label]));
      }
    } catch {
      console.warn(JSON.stringify({
        event: "request_notification.form_labels_unavailable",
        requestId,
        sourceForm: request.source_form,
      }));
    }
  }

  return data;
}
