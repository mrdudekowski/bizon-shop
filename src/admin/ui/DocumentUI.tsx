"use client";
import { Children, Fragment, cloneElement, isValidElement, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { browserAdminClient } from "@/admin/client/localStore";
import type { AdminRole } from "@/admin/domain/types";

export function useAdminRole() {
  const state = useState<AdminRole>("editor");
  const [, setRole] = state;
  useEffect(() => {
    let active = true;
    void browserAdminClient().getSession().then((session) => {
      if (active) setRole(session.role);
    }).catch(() => {
      if (active) setRole("editor");
    });
    return () => { active = false; };
  }, [setRole]);
  return state;
}
export function BlockNav() {
  const nav = useRef<HTMLElement>(null);
  const [blocks, setBlocks] = useState<{ id: string; label: string; elements: HTMLElement[] }[]>([]);
  const [active, setActive] = useState("");
  useLayoutEffect(() => {
    const main = nav.current?.closest("main");
    if (!main) return;

    const children = Array.from(main.children).filter((element): element is HTMLElement => element instanceof HTMLElement);
    const starts = children
      .map((element, index) => ({ element, index, heading: element.tagName === "SECTION" ? element.querySelector<HTMLElement>(":scope > h2") : null }))
      .filter((item): item is { element: HTMLElement; index: number; heading: HTMLElement } => item.heading !== null);
    const items = starts.map(({ element, index, heading }, itemIndex) => {
      const nextStart = starts[itemIndex + 1]?.index ?? children.findIndex((child, childIndex) => childIndex > index && child.classList.contains("documentActions"));
      const end = nextStart < 0 ? children.length : nextStart;
      heading.id ||= `document-block-${itemIndex}`;
      const id = `document-panel-${itemIndex}`;
      element.id = id;
      element.setAttribute("role", "tabpanel");
      element.setAttribute("aria-labelledby", `${id}-tab`);
      element.tabIndex = 0;
      const elements = children.slice(index, end);
      elements.forEach((panelElement) => {
        panelElement.dataset.documentTabPanel = id;
        panelElement.hidden = itemIndex !== 0;
      });
      return { id, label: heading.textContent?.trim() ?? `Раздел ${itemIndex + 1}`, elements };
    });
    setBlocks(items);
    setActive(items[0]?.id ?? "");
  }, []);

  function activate(id: string) {
    setActive(id);
    blocks.forEach((block) => block.elements.forEach((element) => { element.hidden = block.id !== id; }));
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | undefined;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % blocks.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + blocks.length) % blocks.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = blocks.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    const next = nav.current?.querySelectorAll<HTMLButtonElement>("[role='tab']")[nextIndex];
    next?.focus();
    activate(blocks[nextIndex].id);
  }

  return <nav className="blockNav" ref={nav} role="tablist" aria-label="Разделы документа">{blocks.map((block, index) => <button key={block.id} id={`${block.id}-tab`} type="button" role="tab" aria-selected={active === block.id} aria-controls={block.id} tabIndex={active === block.id ? 0 : -1} onClick={() => activate(block.id)} onKeyDown={(event) => onTabKeyDown(event, index)}>{block.label}</button>)}</nav>;
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
