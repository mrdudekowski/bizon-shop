"use client";
import { useSyncExternalStore } from "react";

export type DocumentTab = { id: string; label: string; slug: string };
export type PublishBlockerHint = { text: string; tab?: string; field?: string; anchor?: string };

type DocumentTabsState = {
  tabs: DocumentTab[];
  activeTabId: string;
  blockers: PublishBlockerHint[];
};

/* Навигация по разделам и футер документа живут в разных поддеревьях одного редактора,
   поэтому активный раздел и список блокеров публикации хранятся вне React-дерева. */
const EMPTY_STATE: DocumentTabsState = { tabs: [], activeTabId: "", blockers: [] };
let currentState = EMPTY_STATE;
const listeners = new Set<() => void>();

function publish(next: DocumentTabsState): void {
  currentState = next;
  for (const listener of Array.from(listeners)) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useDocumentTabs(): DocumentTabsState {
  return useSyncExternalStore(
    subscribe,
    () => currentState,
    () => EMPTY_STATE,
  );
}

function sameTabs(left: DocumentTab[], right: DocumentTab[]): boolean {
  return left.length === right.length && left.every((tab, index) => tab.id === right[index].id && tab.label === right[index].label);
}

function sameBlockers(left: PublishBlockerHint[], right: PublishBlockerHint[]): boolean {
  return (
    left.length === right.length &&
    left.every(
      (blocker, index) =>
        blocker.text === right[index].text &&
        blocker.tab === right[index].tab &&
        blocker.field === right[index].field &&
        blocker.anchor === right[index].anchor,
    )
  );
}

export function registerDocumentTabs(tabs: DocumentTab[], preferredSlug?: string | null): void {
  const activeTabId =
    tabs.find((tab) => tab.id === currentState.activeTabId)?.id ??
    tabs.find((tab) => tab.slug === preferredSlug)?.id ??
    tabs[0]?.id ??
    "";
  if (sameTabs(currentState.tabs, tabs) && activeTabId === currentState.activeTabId) return;
  publish({ ...currentState, tabs, activeTabId });
}

export function activateDocumentTab(tabId: string): void {
  if (tabId === currentState.activeTabId) return;
  publish({ ...currentState, activeTabId: tabId });
}

export function resetDocumentTabs(): void {
  publish(EMPTY_STATE);
}

export function setPublishBlockers(blockers: PublishBlockerHint[]): void {
  if (sameBlockers(currentState.blockers, blockers)) return;
  publish({ ...currentState, blockers });
}

function controlForField(scope: ParentNode, field: string): HTMLElement | null {
  for (const label of Array.from(scope.querySelectorAll("label"))) {
    if (!(label.textContent ?? "").trim().startsWith(field)) continue;
    const control = label.querySelector<HTMLElement>("input, select, textarea");
    if (control != null) return control;
  }
  return null;
}

/* Поле может лежать в закрытой вкладке чужой реализации табов — открываем её по aria-controls. */
function revealTabPanels(target: HTMLElement): void {
  for (let node = target.parentElement; node != null; node = node.parentElement) {
    if (!node.hidden || node.id === "") continue;
    document.querySelector<HTMLElement>(`[role="tab"][aria-controls="${node.id}"]`)?.click();
  }
}

export function focusPublishBlocker(hint: PublishBlockerHint): void {
  const tab = currentState.tabs.find((item) => item.label === hint.tab);
  if (tab != null) activateDocumentTab(tab.id);
  requestAnimationFrame(() => {
    const main = document.querySelector("main");
    if (main == null) return;
    const panel = tab == null ? null : document.getElementById(tab.id);
    const field = hint.field == null ? null : controlForField(panel ?? main, hint.field) ?? controlForField(main, hint.field);
    const anchor =
      hint.anchor == null
        ? null
        : document.querySelector<HTMLElement>(`[data-cms-photo-anchor="${hint.anchor}"]`);
    const target = field ?? anchor ?? panel;
    if (target == null) return;
    revealTabPanels(target);
    requestAnimationFrame(() => {
      target.scrollIntoView({ block: "center", behavior: "smooth" });
      target.focus({ preventScroll: true });
    });
  });
}
