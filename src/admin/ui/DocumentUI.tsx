"use client";
import { Children, Fragment, cloneElement, isValidElement, useEffect, useRef, useState, type ReactNode } from "react";
import type { AdminRole } from "@/admin/domain/types";

export function useAdminRole() {
  const state = useState<AdminRole>("editor");
  const [, setRole] = state;
  useEffect(() => {
    const update = (event: Event) => setRole((event as CustomEvent<AdminRole>).detail);
    window.addEventListener("bizon-role-change", update);
    return () => window.removeEventListener("bizon-role-change", update);
  }, [setRole]);
  return state;
}
export function BlockNav() {
  const nav = useRef<HTMLElement>(null);
  const [blocks, setBlocks] = useState<{ id: string; label: string }[]>([]);
  const [active, setActive] = useState("");
  useEffect(() => {
    const headings = [...(nav.current?.closest("main")?.querySelectorAll("h2") ?? [])];
    const items = headings.map((heading, index) => {
      heading.id ||= `document-block-${index}`;
      return { id: heading.id, label: heading.textContent ?? "" };
    });
    setBlocks(items);
    setActive(items[0]?.id ?? "");
    const observer = new IntersectionObserver((entries) => {
      const entry = entries.find((item) => item.isIntersecting);
      if (entry) setActive(entry.target.id);
    }, { rootMargin: "-140px 0px -55% 0px" });
    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, []);
  return <nav className="blockNav" ref={nav} aria-label="Блоки документа">{blocks.map((block) => <a key={block.id} href={`#${block.id}`} aria-current={active === block.id ? "location" : undefined} onClick={() => setActive(block.id)}>{block.label}</a>)}</nav>;
}
function flatten(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment ? flatten(child.props.children) : [child],
  );
}

function keyed(item: ReactNode, index: number) {
  return isValidElement(item) ? cloneElement(item, { key: `document-action-${index}` }) : item;
}

export function DocumentActions({ children }: { children: ReactNode }) {
  const items = flatten(children);
  const feedback = items.filter((item) => isValidElement(item) && item.type === "p");
  const actions = items.filter((item) => !(isValidElement(item) && item.type === "p"));
  return (
    <footer className="documentActions">
      <div className="documentFeedback" aria-live="polite">
        {feedback.length ? feedback.map(keyed) : <p>Черновик сохранён</p>}
      </div>
      <div className="documentButtons">{actions.map(keyed)}</div>
    </footer>
  );
}
