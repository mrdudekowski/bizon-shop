export const PUBLICATION_STATUSES = [
  { label: "Черновик", value: "draft" },
  { label: "Опубликовано", value: "published" },
  { label: "В архиве", value: "archived" },
] as const;

export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number]["value"];

export const MEDIA_TYPES = [
  { label: "Изображение", value: "image" },
  { label: "Видео", value: "video" },
  { label: "PDF", value: "pdf" },
  { label: "Сертификат", value: "certificate" },
  { label: "Чертёж", value: "drawing" },
  { label: "Инструкция", value: "instruction" },
  { label: "Рендер", value: "render" },
  { label: "Таблица размеров", value: "size_table" },
] as const;

/** Application segment on a tire model — not the same as TireType (TBR/OTR). */
export const TIRE_APPLICATION_CATEGORIES = [
  { label: "Long Haul", value: "long_haul" },
  { label: "Regional", value: "regional" },
  { label: "Off-Road", value: "off_road" },
  { label: "Construction", value: "construction" },
] as const;

export { REQUEST_ITEM_TYPES, SOURCE_FORMS, type RequestItemType, type SourceForm } from "@/types/requestItem";

export const REQUEST_STATUSES = [
  { label: "Новая", value: "new" },
  { label: "В работе", value: "in_progress" },
  { label: "Связались", value: "contacted" },
  { label: "Квалифицирована", value: "qualified" },
  { label: "Выиграна", value: "won" },
  { label: "Проиграна", value: "lost" },
  { label: "Закрыта", value: "closed" },
  { label: "Спам", value: "spam" },
  { label: "В архиве", value: "archived" },
] as const;

export const NOTIFICATION_STATUSES = [
  { label: "Ожидает", value: "pending" },
  { label: "Telegram отправлен", value: "telegram_sent" },
  { label: "Telegram ошибка", value: "telegram_failed" },
  { label: "Email отправлен", value: "email_sent" },
  { label: "Email ошибка", value: "email_failed" },
  { label: "Частичная ошибка", value: "partial_failed" },
] as const;

export const CLIENT_TYPES = [
  { label: "Физическое лицо", value: "individual" },
  { label: "Компания", value: "company" },
] as const;

export const PREFERRED_CONTACT_METHODS = [
  { label: "Телефон", value: "phone" },
  { label: "Email", value: "email" },
  { label: "Telegram", value: "telegram" },
  { label: "WhatsApp", value: "whatsapp" },
] as const;

export const WHEEL_CONSTRUCTION_METHODS = [
  { label: "Кованый", value: "forged" },
  { label: "Литой", value: "cast" },
  { label: "Flow-formed", value: "flow_formed" },
  { label: "Стальной", value: "steel" },
  { label: "Другое", value: "other" },
] as const;

export const ADMIN_GROUPS = {
  catalog: "Каталог",
  tireCatalog: "Каталог шин",
  wheelCatalog: "Каталог дисков",
  content: "Контент",
  media: "Медиа",
  sales: "Продажи",
  settings: "Настройки",
} as const;
