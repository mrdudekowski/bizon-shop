import type { AdminClientError } from "./errors";

export const ERROR_TEXT: Record<AdminClientError["code"], string> = {
  slug_taken: "Этот адрес страницы уже занят",
  invalid_slug: "Нельзя изменить адрес страницы",
  publish_blocked: "Публикация закрыта",
  category_not_published: "Сначала опубликуйте категорию товара",
  category_has_published_products: "Сначала снимите с публикации товары этой категории",
  unsaved: "Сначала сохраните черновик",
  media_in_use: "Файл ещё используется",
  storage_unavailable: "Хранилище S3 не настроено",
  cannot_disable_self: "Нельзя отключить себя",
  last_admin: "Нельзя отключить последнего администратора",
  invalid_credentials: "Неверный логин или пароль",
  unauthorized: "Сессия закончилась. Войдите снова",
  forbidden: "Недостаточно прав для этого действия",
  pending_review_exists: "Эту карточку уже отправили на одобрение. Дождитесь решения администратора.",
  changeset_not_pending: "Этот пакет нельзя обработать в текущем статусе",
  review_comment_required: "Напишите комментарий, чтобы вернуть пакет на доработку",
};
