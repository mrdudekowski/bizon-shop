"use client";

import { ContextualContactForm } from "@/components/forms/ContextualContactForm";
import { resolveContactIntent } from "@/lib/requests/contactIntent";

export type SelectionFilterDetail = { label: string; value?: string };

export function CatalogSelectionFeedback({
  kind,
  filters,
  returnHref,
}: {
  kind: "tire" | "wheel";
  filters: readonly SelectionFilterDetail[];
  returnHref?: string;
}) {
  const subject = kind === "tire" ? "tire-selection" : "wheel-selection";
  const intent = resolveContactIntent(new URLSearchParams(`subject=${subject}`));
  const details = filters
    .filter((filter) => filter.value?.trim())
    .map((filter) => `${filter.label}: ${filter.value?.trim()}`);
  const selectionDetails = details.length > 0
    ? `Параметры фильтрации:\n${details.join("\n")}`
    : undefined;

  return (
    <ContextualContactForm
      intent={intent}
      introCopy={{
        heading: "Не нашли подходящую модель?",
        description: "Оставьте свои контакты, и наш менеджер свяжется с вами, чтобы помочь с подбором.",
      }}
      selectionDetails={selectionDetails}
      successHref={returnHref}
    />
  );
}
