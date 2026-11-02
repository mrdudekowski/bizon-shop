"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import styles from "./EditorialListing.module.css";

export function EditorialListingFilterController({ activeTopic }: { activeTopic?: string }) {
  const searchParams = useSearchParams();
  const queryTopic = searchParams.get("topic") ?? "";

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-editorial-listing]");
    if (!root) return;
    const cards = [...root.querySelectorAll<HTMLElement>("[data-editorial-card]")];
    const selected = queryTopic || activeTopic || "";
    let visible = 0;

    for (const card of cards) {
      let topics: string[] = [];
      try { topics = JSON.parse(card.dataset.taxonomy ?? "[]") as string[]; } catch {}
      const matches = !selected || topics.includes(selected);
      card.hidden = !matches;
      if (matches) visible += 1;
    }

    const empty = root.querySelector<HTMLElement>("[data-editorial-no-results]");
    if (empty) empty.hidden = visible !== 0;
    for (const link of root.querySelectorAll<HTMLAnchorElement>("[data-topic-filter]")) {
      const selectedLink = (link.dataset.topicFilter ?? "") === selected;
      link.setAttribute("aria-current", selectedLink ? "page" : "false");
      link.classList.toggle(styles.taxonomyLinkActive, selectedLink);
      link.classList.toggle(styles.taxonomyLink, !selectedLink);
    }
  }, [activeTopic, queryTopic]);

  return null;
}
