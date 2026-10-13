"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { formatTireModelCount } from "@/lib/catalog/tireFilters";

export function TireCatalogFilterController() {
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-tire-filter-results]");
    if (!root) return;
    const filters = new URLSearchParams(query);
    const application = filters.get("application")?.trim();
    const axle = filters.get("axle")?.trim();
    const size = filters.get("size")?.trim().toLocaleLowerCase("ru-RU");
    const cards = [...root.querySelectorAll<HTMLElement>("[data-tire-model-card]")];
    let visible = 0;

    for (const card of cards) {
      const applications = (card.dataset.applications ?? "").split("|").filter(Boolean);
      const axles = (card.dataset.axles ?? "").split("|").filter(Boolean);
      const sizes = (card.dataset.sizes ?? "").split("|").filter(Boolean);
      const matches = (!application || applications.includes(application))
        && (!axle || axles.includes(axle))
        && (!size || sizes.includes(size));
      card.hidden = !matches;
      if (matches) visible += 1;
    }

    const count = root.querySelector<HTMLElement>("[data-tire-result-count]");
    if (count) count.textContent = formatTireModelCount(visible);
    const empty = root.querySelector<HTMLElement>("[data-tire-no-results]");
    if (empty) empty.hidden = visible !== 0;

    const form = document.querySelector<HTMLFormElement>('form[aria-label="Фильтры каталога"]');
    for (const [name, value] of [["application", application], ["axle", axle], ["size", size]] as const) {
      const control = form?.elements.namedItem(name);
      if (control instanceof HTMLInputElement || control instanceof HTMLSelectElement) {
        control.value = value ?? "";
      }
    }
  }, [query]);

  return null;
}
