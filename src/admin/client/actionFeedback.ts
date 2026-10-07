import { AdminClientError } from "./errors";
import { ERROR_TEXT } from "./errorText";

export const DOCUMENT_STATUS = {
  saved: "Черновик сохранён",
  published: "Опубликовано. На сайте новая версия.",
  hidden: "Скрыто с сайта",
} as const;

export function actionErrorText(error: unknown, fallback: string): string {
  return error instanceof AdminClientError ? ERROR_TEXT[error.code] : fallback;
}

const STATUS_COPY = new Set<string>(Object.values(DOCUMENT_STATUS));

export function feedbackRole(text: string): "status" | "alert" {
  return STATUS_COPY.has(text) ? "status" : "alert";
}
