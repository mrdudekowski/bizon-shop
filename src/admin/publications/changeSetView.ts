import type { ChangeSet, ChangeSetStatus, FieldChange, FieldValue, StatusEntity } from "@/admin/domain/types";

export const CHANGESET_STATUS_LABEL: Record<ChangeSetStatus, string> = {
  open: "Черновик",
  pending_review: "На одобрении",
  returned: "Вернули",
  published: "Опубликовано",
  cancelled: "Отменено",
};

export function editorHref(entityType: StatusEntity, entityId: string): string {
  const id = encodeURIComponent(entityId);
  if (entityType === "tire-model") return `/tires/editor?id=${id}`;
  if (entityType === "tire-direction") return `/tires/directions/editor?id=${id}`;
  if (entityType === "wheel-model") return `/wheels/editor?id=${id}`;
  if (entityType === "wheel-type") return `/wheels/types/editor?id=${id}`;
  if (entityType === "shop-product") return `/shop/product-editor?id=${id}`;
  if (entityType === "shop-category") return `/shop/category-editor?id=${id}`;
  if (entityType === "page") return `/pages/editor?key=${id}`;
  return `/materials/editor?id=${id}`;
}

export function changeCount(pack: ChangeSet): number {
  return pack.entries.reduce((total, entry) => total + entry.fieldChanges.length, 0);
}

export function documentTitles(pack: ChangeSet): string {
  return pack.entries.map((entry) => entry.entityTitle).filter(Boolean).join(", ");
}

export function packTitle(pack: ChangeSet): string {
  const count = changeCount(pack);
  const titles = documentTitles(pack);
  return titles ? `${count} ${pluralChanges(count)} · ${titles}` : `${count} ${pluralChanges(count)}`;
}

export function pluralChanges(count: number): string {
  const abs = Math.abs(count) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return "изменений";
  if (last === 1) return "изменение";
  if (last >= 2 && last <= 4) return "изменения";
  return "изменений";
}

export function shortFieldLine(change: FieldChange): string {
  const field = change.location.itemLabel
    ? `${change.location.field} ${change.location.itemLabel}`
    : change.location.field;
  return `${change.location.section} · ${change.location.document} · ${change.location.tab} · ${field}`;
}

export function formatFieldValue(value: FieldValue): string {
  if (value.kind === "empty") return "—";
  if (value.kind === "boolean") return value.value ? "Да" : "Нет";
  if (value.kind === "number") {
    if (value.value == null) return "—";
    return Number.isInteger(value.value)
      ? value.value.toLocaleString("ru-RU")
      : value.value.toLocaleString("ru-RU", { maximumFractionDigits: 2 });
  }
  if (value.kind === "image") return value.alt?.trim() || "";
  return value.value.trim() || "—";
}

export function formatExactWhen(iso: string | null): string {
  if (iso == null) return "—";
  return new Date(iso).toLocaleString("ru-RU");
}

export function formatRelativeWhen(iso: string, now = Date.now()): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const startThat = new Date(date);
  startThat.setHours(0, 0, 0, 0);
  const diffDays = Math.round((startToday.getTime() - startThat.getTime()) / 86_400_000);
  if (diffDays === 0) return `сегодня в ${time}`;
  if (diffDays === 1) return `вчера в ${time}`;
  return date.toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
