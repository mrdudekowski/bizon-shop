import { AdminClientError } from "@/admin/client/errors";

export function uploadErrorText(error: unknown): string {
  if (error instanceof AdminClientError && error.code === "media_cleanup_pending") {
    return "Не удалось сохранить файл. Он отмечен для очистки; повторите загрузку позже.";
  }
  if (error instanceof AdminClientError && error.code === "storage_unavailable") {
    return "Хранилище файлов сейчас недоступно. Файл не загружен. Попробуйте позже.";
  }
  if (error instanceof AdminClientError && error.code === "database_unavailable") {
    return "База сайта сейчас недоступна. Файл не загружен. Попробуйте позже.";
  }
  if (error instanceof AdminClientError && error.code === "database_save_failed") {
    return "Не удалось сохранить сведения о файле. Загрузка отменена. Попробуйте позже.";
  }
  if (error instanceof AdminClientError && error.code === "network") {
    return "Нет связи с сервером. Проверьте, что API запущен, и повторите загрузку.";
  }
  if (error instanceof AdminClientError && error.code === "publish_blocked") {
    return "Файл не подошёл. Нужны JPEG, PNG, WebP или PDF до 20 МБ.";
  }
  return "Не удалось загрузить файл. Попробуйте другой файл.";
}
