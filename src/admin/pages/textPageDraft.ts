import type { PageFormDraft, PageKey, StubPageDraft } from "@/admin/domain/types";

export const TEXT_CANVAS_PAGE_KEYS = [
  "delivery",
  "payment",
  "warranty",
  "branding",
  "become-a-supplier",
  "shop-delivery",
  "shop-payment",
  "shop-warranty",
  "shop-become-a-supplier",
] as const;

export type TextCanvasPageKey = (typeof TEXT_CANVAS_PAGE_KEYS)[number];

const DOCUMENT_PAGE_KEYS = new Set<TextCanvasPageKey>([
  "delivery",
  "payment",
  "warranty",
  "shop-delivery",
  "shop-payment",
  "shop-warranty",
]);

const TWIN_PAGE_KEY: Partial<Record<TextCanvasPageKey, TextCanvasPageKey>> = {
  delivery: "shop-delivery",
  "shop-delivery": "delivery",
  payment: "shop-payment",
  "shop-payment": "payment",
  warranty: "shop-warranty",
  "shop-warranty": "warranty",
  "become-a-supplier": "shop-become-a-supplier",
  "shop-become-a-supplier": "become-a-supplier",
};

const LOCKED_CART_HREF: Partial<Record<TextCanvasPageKey, string>> = {
  payment: "/cart",
  "shop-payment": "/shop/cart",
};

const CART_HREFS = new Set(["/cart", "/shop/cart"]);

const ALWAYS_FORM_PAGE_KEYS = new Set<string>([
  "become-a-supplier",
  "shop-become-a-supplier",
  "warranty",
  "shop-warranty",
  "branding",
]);

export function isTextCanvasPage(id: string): id is TextCanvasPageKey {
  return (TEXT_CANVAS_PAGE_KEYS as readonly string[]).includes(id);
}

export function allowsEmptyChapter(id: string): boolean {
  return isTextCanvasPage(id) && DOCUMENT_PAGE_KEYS.has(id);
}

export function twinPageKey(id: string): TextCanvasPageKey | null {
  if (!isTextCanvasPage(id)) return null;
  return TWIN_PAGE_KEY[id] ?? null;
}

export function lockedCartHref(id: string): string | null {
  if (!isTextCanvasPage(id)) return null;
  return LOCKED_CART_HREF[id] ?? null;
}

export function isCartHref(href: string | undefined): boolean {
  return href != null && CART_HREFS.has(href);
}

/** Supplier, warranty, and branding always edit a form. Delivery edits one only when the draft already has it. Payment never does. */
export function pageShowsRequestForm(draft: StubPageDraft): boolean {
  if (draft.id === "payment" || draft.id === "shop-payment") return false;
  if (ALWAYS_FORM_PAGE_KEYS.has(draft.id)) return true;
  if (draft.id === "delivery" || draft.id === "shop-delivery") return draft.form != null;
  return false;
}

export function emptyChapterKind(draft: StubPageDraft): "section" | "feature" {
  if ((draft.sections ?? []).length > 0) return "section";
  if ((draft.features ?? []).length > 0) return "feature";
  return "section";
}

function keptHref(incoming: string | undefined, fallback: string): string {
  if (incoming == null || isCartHref(incoming)) return fallback;
  return incoming;
}

function copyCta(current: StubPageDraft, twin: StubPageDraft): StubPageDraft["cta"] {
  const locked = lockedCartHref(current.id);
  const twinCta = twin.cta;
  const currentCta = current.cta;
  if (!twinCta && !currentCta && !locked) return currentCta;
  const label = twinCta?.label ?? currentCta?.label ?? "";
  const href = locked ?? keptHref(twinCta?.href, currentCta?.href ?? "");
  const secondaryLabel = twinCta?.secondaryLabel ?? currentCta?.secondaryLabel;
  const secondaryHref = keptHref(twinCta?.secondaryHref, currentCta?.secondaryHref ?? "");
  return {
    label,
    href,
    ...(secondaryLabel ? { secondaryLabel } : {}),
    ...(secondaryHref ? { secondaryHref } : {}),
  };
}

function copyForm(current: StubPageDraft, twin: StubPageDraft): PageFormDraft | undefined {
  if (!pageShowsRequestForm(current)) return current.form;
  if (!twin.form) return current.form;
  return {
    successMessage: twin.form.successMessage,
    ...(twin.form.submitLabel != null ? { submitLabel: twin.form.submitLabel } : {}),
    fields: twin.form.fields.map((field) => ({ ...field })),
  };
}

/** Copies words into the current draft. Cart addresses stay on their own surface. */
export function copyEditorialText(current: StubPageDraft, twin: StubPageDraft): StubPageDraft {
  return {
    ...current,
    id: current.id,
    seoTitle: twin.seoTitle,
    seoDescription: twin.seoDescription,
    hero: {
      ...current.hero,
      eyebrow: twin.hero.eyebrow,
      title: twin.hero.title,
      lead: twin.hero.lead,
    },
    featuresHeading: twin.featuresHeading ?? current.featuresHeading,
    features: twin.features?.map((item) => ({ ...item })) ?? current.features,
    sections: twin.sections?.map((item) => ({ ...item })) ?? current.sections,
    notice: twin.notice ? { body: twin.notice.body } : twin.notice === null ? null : current.notice,
    proof: current.proof
      ? {
          ...current.proof,
          title: twin.proof?.title ?? "",
          text: twin.proof?.text ?? "",
        }
      : current.proof,
    cta: copyCta(current, twin),
    form: copyForm(current, twin),
    documents: current.documents,
  };
}

export function dropClearedCanvasBlocks(draft: StubPageDraft): StubPageDraft {
  return {
    ...draft,
    features: draft.features?.filter((item) => item.title.trim() || item.text.trim()),
    sections: draft.sections?.filter((item) => item.heading.trim() || item.body.trim()),
    form: draft.form
      ? { ...draft.form, fields: draft.form.fields.filter((field) => field.label.trim()) }
      : draft.form,
  };
}

const SHARED_PAGE_KEYS = new Set<PageKey>(["about", "contact", "privacy-policy"]);

/** Old addresses. The public site redirects them; the list must not open the block editor. */
const RETIRED_PAGE_KEYS = new Set<PageKey>(["delivery-geography", "shop-delivery-returns"]);

export type PageListSurface = "shared" | "tires" | "shop";

export function pageListSurface(id: PageKey): PageListSurface | null {
  if (RETIRED_PAGE_KEYS.has(id)) return null;
  if (SHARED_PAGE_KEYS.has(id)) return "shared";
  if (id.startsWith("shop-")) return "shop";
  return "tires";
}

/** The public URL already redirects. The editor opens the page that replaced it. */
export function retiredPageReplacement(id: PageKey): PageKey | null {
  if (id === "delivery-geography") return "delivery";
  if (id === "shop-delivery-returns") return "shop-delivery";
  return null;
}
