"use client";
import { Children, Fragment, cloneElement, isValidElement, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { browserAdminClient } from "@/admin/client/localStore";
import { canEditorPerform, type EditorAction } from "@/admin/domain/editorPermissions";
import { slugifyTitle } from "@/admin/domain/slug";
import type { AdminRole, AdminSession } from "@/admin/domain/types";
import { activateDocumentTab, registerDocumentTabs, resetDocumentTabs, useDocumentTabs } from "@/admin/ui/documentTabs";

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

export function useAdminSession() {
  const [session, setSession] = useState<AdminSession | null>(null);
  useEffect(() => {
    let active = true;
    void browserAdminClient()
      .getSession()
      .then((next) => {
        if (active) setSession({ ...next, capabilities: next.capabilities ?? [] });
      })
      .catch(() => {
        if (active) setSession({ login: "", role: "editor", capabilities: [] });
      });
    return () => {
      active = false;
    };
  }, []);
  return session;
}

export function useCanPerform(action: EditorAction): boolean {
  const session = useAdminSession();
  return session != null && canEditorPerform(session, action);
}

const TAB_PARAM = "tab";

type DocumentPanel = { id: string; label: string; slug: string; elements: HTMLElement[] };

function discoverPanels(main: Element): DocumentPanel[] {
  const children = Array.from(main.children).filter((element): element is HTMLElement => element instanceof HTMLElement);
  const starts = children
    .map((element, index) => ({ element, index, heading: element.tagName === "SECTION" ? element.querySelector<HTMLElement>(":scope > h2") : null }))
    .filter((item): item is { element: HTMLElement; index: number; heading: HTMLElement } => item.heading !== null);
  return starts.map(({ element, index, heading }, itemIndex) => {
    const nextStart = starts[itemIndex + 1]?.index ?? children.findIndex((child, childIndex) => childIndex > index && child.classList.contains("documentActions"));
    const end = nextStart < 0 ? children.length : nextStart;
    heading.id ||= `document-block-${itemIndex}`;
    const id = `document-panel-${itemIndex}`;
    element.id = id;
    element.setAttribute("role", "tabpanel");
    element.setAttribute("aria-labelledby", `${id}-tab`);
    element.tabIndex = 0;
    const elements = children.slice(index, end);
    elements.forEach((panelElement) => { panelElement.dataset.documentTabPanel = id; });
    const label = heading.textContent?.trim() || `Раздел ${itemIndex + 1}`;
    return { id, label, slug: slugifyTitle(label) || `razdel-${itemIndex + 1}`, elements };
  });
}

function tabSlugFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get(TAB_PARAM);
}

export function BlockNav() {
  const nav = useRef<HTMLElement>(null);
  const [panels, setPanels] = useState<DocumentPanel[]>([]);
  const { tabs, activeTabId, blockers } = useDocumentTabs();

  useLayoutEffect(() => {
    const main = nav.current?.closest("main");
    if (!main) return;
    const scan = () => {
      const found = discoverPanels(main);
      setPanels(found);
      registerDocumentTabs(found.map(({ id, label, slug }) => ({ id, label, slug })), tabSlugFromUrl());
    };
    scan();
    // Редактор добавляет и убирает секции на лету, поэтому список разделов пересобирается.
    const observer = new MutationObserver(scan);
    observer.observe(main, { childList: true });
    return () => {
      observer.disconnect();
      resetDocumentTabs();
    };
  }, []);

  useLayoutEffect(() => {
    for (const panel of panels) {
      for (const element of panel.elements) element.hidden = panel.id !== activeTabId;
    }
  });

  useEffect(() => {
    const slug = tabs.find((tab) => tab.id === activeTabId)?.slug;
    if (slug == null || slug === tabSlugFromUrl()) return;
    const url = new URL(window.location.href);
    url.searchParams.set(TAB_PARAM, slug);
    // replaceState, а не pushState: «Назад» должен вести к списку, а не перебирать вкладки.
    window.history.replaceState(window.history.state, "", url);
  }, [tabs, activeTabId]);

  useEffect(() => {
    function onPopState() {
      const tab = tabs.find((item) => item.slug === tabSlugFromUrl());
      if (tab != null) activateDocumentTab(tab.id);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [tabs]);

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | undefined;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    const next = nav.current?.querySelectorAll<HTMLButtonElement>("[role='tab']")[nextIndex];
    next?.focus();
    activateDocumentTab(tabs[nextIndex].id);
  }

  return <nav className="blockNav" ref={nav} role="tablist" aria-label="Разделы документа">{tabs.map((tab, index) => {
    const unresolved = blockers.filter((blocker) => blocker.tab === tab.label).length;
    return <button key={tab.id} id={`${tab.id}-tab`} type="button" role="tab" aria-selected={activeTabId === tab.id} aria-controls={tab.id} tabIndex={activeTabId === tab.id ? 0 : -1} onClick={() => activateDocumentTab(tab.id)} onKeyDown={(event) => onTabKeyDown(event, index)}>
      {tab.label}
      {unresolved > 0 ? <span className="blockNavCount" title={`Не заполнено для публикации: ${unresolved}`}>{unresolved}</span> : null}
    </button>;
  })}</nav>;
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
