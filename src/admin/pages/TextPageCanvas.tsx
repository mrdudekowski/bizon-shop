"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type DragEvent, type FocusEvent } from "react";

import { AdminClientError } from "@/admin/client/errors";
import { browserAdminClient } from "@/admin/client/localStore";
import type { ImagePlacement, PageFormDraft, StubPageDraft } from "@/admin/domain/types";
import { resolveMediaPreviewUrl } from "@/admin/domain/catalogPreviewUrl";
import { MediaPicker } from "@/admin/media/MediaPicker";
import { uploadErrorText } from "@/admin/media/uploadError";
import { IMAGE_UPLOAD_TYPES, firstAllowedFile, uploadLibraryFile } from "@/admin/media/uploadLibraryFile";

import {
  allowsEmptyChapter,
  copyEditorialText,
  emptyChapterKind,
  lockedCartHref,
  pageShowsRequestForm,
  twinPageKey,
} from "./textPageDraft";
import { PAGE_IMAGE_FRAMES, focalObjectPosition, type PageImageFrame } from "./pageImageFrame";
import frameStyles from "./pageImageFrame.module.css";
import styles from "./TextPageCanvas.module.css";

const EMPTY_FORM: PageFormDraft = { successMessage: "", fields: [] };

function staysInside(event: FocusEvent, node: HTMLElement | null): boolean {
  const next = event.relatedTarget;
  return next instanceof Node && node != null && node.contains(next);
}

function dismissDialog(dialog: HTMLDialogElement | null) {
  if (typeof dialog?.close === "function") dialog.close();
  else dialog?.removeAttribute("open");
}

function placementWithAsset(current: ImagePlacement | null | undefined, assetId: string, alt: string): ImagePlacement {
  if (current) return { ...current, assetId, alt };
  return { assetId, alt, focalX: 0.5, focalY: 0.5, crop: { x: 0, y: 0, width: 1, height: 1 } };
}

function EditableText({
  label,
  value,
  multiline = false,
  startEditing = false,
  prominent,
  onChange,
  onBlur,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  startEditing?: boolean;
  prominent?: string;
  onChange: (value: string) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) {
  const [editing, setEditing] = useState(startEditing);
  if (!editing) {
    return (
      <button type="button" className={`${styles.textButton} ${prominent ?? ""}`} onClick={() => setEditing(true)}>
        {value.trim() || label}
      </button>
    );
  }
  if (multiline) {
    return (
      <textarea aria-label={label} rows={4} value={value} autoFocus onChange={(event) => onChange(event.target.value)} onBlur={onBlur} />
    );
  }
  return (
    <input aria-label={label} value={value} autoFocus onChange={(event) => onChange(event.target.value)} onBlur={onBlur} />
  );
}

function ImageSlot({
  image,
  label,
  frame,
  onChange,
}: {
  image: ImagePlacement | null | undefined;
  label: string;
  frame: PageImageFrame;
  onChange: (image: ImagePlacement | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [alt, setAlt] = useState(image?.alt ?? "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dropError, setDropError] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const droppingRef = useRef(false);
  const assetId = image?.assetId;

  useEffect(() => {
    if (!assetId) {
      setPreviewUrl(null);
      return;
    }
    let cancelled = false;
    const client = browserAdminClient();
    if (typeof client.listAssets !== "function") return;
    void client.listAssets().then((assets) => {
      if (cancelled) return;
      const asset = assets.find((item) => item.id === assetId);
      setPreviewUrl(resolveMediaPreviewUrl(asset?.dataUrl));
    }).catch(() => {
      if (!cancelled) setPreviewUrl(null);
    });
    return () => {
      cancelled = true;
    };
  }, [assetId]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    if (dialog.open) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }, [open]);

  function close() {
    dismissDialog(dialogRef.current);
    setOpen(false);
  }

  function onDragOver(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
  }

  async function onDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (droppingRef.current) return;
    const file = firstAllowedFile(event.dataTransfer.files, IMAGE_UPLOAD_TYPES);
    if (!file) {
      setDropError(uploadErrorText(new AdminClientError("publish_blocked")));
      return;
    }
    droppingRef.current = true;
    setDropError("");
    try {
      const created = await uploadLibraryFile(file, IMAGE_UPLOAD_TYPES);
      onChange(placementWithAsset(image, created.id, image?.alt ?? alt));
    } catch (cause) {
      setDropError(uploadErrorText(cause));
    } finally {
      droppingRef.current = false;
    }
  }

  return (
    <>
      <button
        type="button"
        className={`${styles.imageButton} ${frameStyles.host}`}
        aria-label={label}
        onClick={() => { setAlt(image?.alt ?? ""); setOpen(true); }}
        onDragOver={onDragOver}
        onDrop={(event) => void onDrop(event)}
      >
        <span className={frameStyles.shot} data-page-frame={frame.id}>
          {previewUrl ? (
            <img
              className={frameStyles.image}
              src={previewUrl}
              alt={image?.alt ?? ""}
              style={frame.usesFocal ? { ["--frame-position" as string]: focalObjectPosition(image?.focalX, image?.focalY) } : undefined}
            />
          ) : (
            <span className={`${styles.imageFallback} ${frameStyles.empty}`}>{label}</span>
          )}
        </span>
      </button>
      {dropError ? <p role="alert">{dropError}</p> : null}
      {open ? (
        <dialog ref={dialogRef} className={styles.dialog} aria-label={label} onClose={() => setOpen(false)}>
          <div className={styles.dialogBody}>
            <h2>{label}</h2>
            <div className={styles.imageDialog}>
              <label>
                Подпись
                <input value={alt} onChange={(event) => {
                  const nextAlt = event.target.value;
                  setAlt(nextAlt);
                  if (image) onChange({ ...image, alt: nextAlt });
                }} />
              </label>
              <MediaPicker
                onSelect={(asset) => {
                  onChange(placementWithAsset(image, asset.id, alt));
                  close();
                }}
              />
            </div>
            <button type="button" onClick={close}>Закрыть</button>
          </div>
        </dialog>
      ) : null}
    </>
  );
}

function ChapterBlock({
  title,
  text,
  startEditing,
  onChange,
  onRemove,
}: {
  title: string;
  text: string;
  startEditing: boolean;
  onChange: (next: { title: string; text: string }) => void;
  onRemove: () => void;
}) {
  const rowRef = useRef<HTMLElement>(null);
  return (
    <article
      ref={rowRef}
      className={styles.chapterRow}
      onBlur={(event) => {
        if (staysInside(event, rowRef.current)) return;
        if (!title.trim() && !text.trim()) onRemove();
      }}
    >
      <div className={styles.chapterCopy}>
        <div className={styles.chapterTitle}>
          <EditableText
            label="Заголовок главы"
            value={title}
            startEditing={startEditing}
            onChange={(nextTitle) => onChange({ title: nextTitle, text })}
          />
        </div>
        <div className={styles.chapterText}>
          <EditableText
            label="Текст главы"
            value={text}
            multiline
            onChange={(nextText) => onChange({ title, text: nextText })}
          />
        </div>
      </div>
      <button type="button" className={styles.removeChapter} aria-label="Удалить главу" onClick={onRemove}>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M9 3h6l1 2h5v2H3V5h5l1-2zm1 6h2v10h-2V9zm4 0h2v10h-2V9zM6 9h2v10H6V9zm1 12h10a1 1 0 0 0 1-1V8H6v12a1 1 0 0 0 1 1z" />
        </svg>
      </button>
    </article>
  );
}

function FormFields({
  form,
  onChange,
}: {
  form: PageFormDraft;
  onChange: (form: PageFormDraft) => void;
}) {
  const [focusId, setFocusId] = useState<string | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !submitOpen) return;
    if (dialog.open) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }, [submitOpen]);

  function patchField(id: string, patch: Partial<PageFormDraft["fields"][number]>) {
    onChange({
      ...form,
      fields: form.fields.map((field) => (field.id === id ? { ...field, ...patch } : field)),
    });
  }

  return (
    <section className={styles.form} aria-label="Форма заявки">
      {form.fields.map((field) => (
        <FieldRow
          key={field.id}
          field={field}
          startEditing={focusId === field.id}
          onLabel={(label) => patchField(field.id, { label })}
          onRequired={(required) => patchField(field.id, { required })}
          onRemove={() => onChange({ ...form, fields: form.fields.filter((item) => item.id !== field.id) })}
        />
      ))}
      <button
        type="button"
        className={styles.emptyRow}
        onClick={() => {
          const id = `field-${crypto.randomUUID()}`;
          setFocusId(id);
          onChange({ ...form, fields: [...form.fields, { id, label: "", type: "text", required: false }] });
        }}
      >
        Новое поле
      </button>
      <button type="button" className={styles.submitButton} onClick={() => setSubmitOpen(true)}>
        {form.submitLabel?.trim() || "Отправить"}
      </button>
      {submitOpen ? (
        <dialog ref={dialogRef} className={styles.dialog} aria-label="Кнопка отправки" onClose={() => setSubmitOpen(false)}>
          <div className={styles.dialogBody}>
            <h2>Кнопка отправки</h2>
            <div className={styles.dialogFields}>
              <label>
                Текст кнопки
                <input value={form.submitLabel ?? ""} onChange={(event) => onChange({ ...form, submitLabel: event.target.value })} />
              </label>
              <label>
                Текст после отправки
                <textarea value={form.successMessage} onChange={(event) => onChange({ ...form, successMessage: event.target.value })} />
              </label>
            </div>
            <button type="button" onClick={() => {
              dismissDialog(dialogRef.current);
              setSubmitOpen(false);
            }}>Закрыть</button>
          </div>
        </dialog>
      ) : null}
    </section>
  );
}

function FieldRow({
  field,
  startEditing,
  onLabel,
  onRequired,
  onRemove,
}: {
  field: PageFormDraft["fields"][number];
  startEditing: boolean;
  onLabel: (label: string) => void;
  onRequired: (required: boolean) => void;
  onRemove: () => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={rowRef}
      className={styles.field}
      role="group"
      aria-label={field.label.trim() || "Новое поле"}
      onBlur={(event) => {
        if (staysInside(event, rowRef.current)) return;
        if (!field.label.trim()) onRemove();
      }}
    >
      <EditableText
        label="Название поля"
        value={field.label}
        startEditing={startEditing}
        onChange={onLabel}
      />
      <label className={styles.required}>
        <input type="checkbox" checked={field.required} onChange={(event) => onRequired(event.target.checked)} />
        Обязательное
      </label>
    </div>
  );
}

function LinkDialog({
  label,
  href,
  lockedHref,
  onChange,
  onClose,
}: {
  label: string;
  href: string;
  lockedHref: string | null;
  onChange: (next: { label: string; href: string }) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }, []);
  return (
    <dialog ref={dialogRef} className={styles.dialog} aria-label="Ссылка" onClose={onClose}>
      <div className={styles.dialogBody}>
        <h2>Ссылка</h2>
        <div className={styles.dialogFields}>
          <label>
            Текст ссылки
            <input value={label} onChange={(event) => onChange({ label: event.target.value, href: lockedHref ?? href })} />
          </label>
          {lockedHref ? <p className={styles.lockedHref}>Адрес корзины: {lockedHref}</p> : (
            <label>
              Адрес ссылки
              <input value={href} onChange={(event) => onChange({ label, href: event.target.value })} />
            </label>
          )}
        </div>
        <button type="button" onClick={() => { dismissDialog(dialogRef.current); onClose(); }}>Закрыть</button>
      </div>
    </dialog>
  );
}

export function TextPageCanvas({
  draft,
  onChange,
  canPublish,
  publishing,
  dirty,
  onPublish,
}: {
  draft: StubPageDraft;
  onChange: (next: StubPageDraft) => void;
  canPublish: boolean;
  publishing: boolean;
  dirty: boolean;
  onPublish: () => void;
}) {
  const [focusChapterId, setFocusChapterId] = useState<string | null>(null);
  const [linkTarget, setLinkTarget] = useState<"primary" | "secondary" | null>(null);
  const [copyNote, setCopyNote] = useState("");
  const [copying, setCopying] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const seoDialogRef = useRef<HTMLDialogElement>(null);
  const twin = twinPageKey(draft.id);
  const locked = lockedCartHref(draft.id);
  const showForm = pageShowsRequestForm(draft);
  const form = draft.form ?? EMPTY_FORM;
  const chapterKind = emptyChapterKind(draft);
  const primary = locked
    ? { label: draft.cta?.label?.trim() || "Перейти к заявке", href: locked }
    : draft.cta && (draft.cta.label.trim() || draft.cta.href.trim())
      ? { label: draft.cta.label || "Ссылка", href: draft.cta.href }
      : null;
  const secondary = draft.cta?.secondaryLabel?.trim() || draft.cta?.secondaryHref?.trim()
    ? { label: draft.cta?.secondaryLabel ?? "", href: draft.cta?.secondaryHref ?? "" }
    : null;

  function patchCta(patch: { label?: string; href?: string; secondaryLabel?: string; secondaryHref?: string }) {
    const current = draft.cta ?? { label: "", href: locked ?? "" };
    onChange({
      ...draft,
      cta: {
        ...current,
        ...patch,
        href: locked ?? patch.href ?? current.href,
      },
    });
  }

  async function copyFromTwin() {
    if (!twin) return;
    setCopying(true);
    setCopyNote("");
    try {
      const record = await browserAdminClient().getPage(twin);
      const source = record.draft;
      if (source.id === "home" || source.id === "shop-home") return;
      onChange(copyEditorialText(draft, source));
    } catch {
      setCopyNote("Не удалось прочитать текст другой стороны");
    } finally {
      setCopying(false);
    }
  }

  function addChapter() {
    const id = `${chapterKind}-${crypto.randomUUID()}`;
    setFocusChapterId(id);
    if (chapterKind === "feature") {
      onChange({ ...draft, features: [...(draft.features ?? []), { id, title: "", text: "" }] });
      return;
    }
    onChange({ ...draft, sections: [...(draft.sections ?? []), { id, heading: "", body: "" }] });
  }

  useEffect(() => {
    const dialog = seoDialogRef.current;
    if (!dialog || !seoOpen) return;
    if (dialog.open) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }, [seoOpen]);

  return (
    <div className={styles.canvas}>
      <div className={styles.toolbar}>
        <button type="button" onClick={() => setSeoOpen(true)}>В поиске</button>
        {canPublish ? (
          <button type="button" disabled={dirty || publishing} onClick={onPublish}>
            {publishing ? "Публикуем…" : "Опубликовать"}
          </button>
        ) : null}
        {twin ? (
          <Link href={`/pages/editor?key=${encodeURIComponent(twin)}`}>
            {twin.startsWith("shop-") ? "Открыть в BIZON SHOP" : "Открыть в BIZON TIRES"}
          </Link>
        ) : null}
        {twin ? (
          <button type="button" disabled={copying} onClick={() => void copyFromTwin()}>
            Подставить текст с другой стороны
          </button>
        ) : null}
      </div>
      {seoOpen ? (
        <dialog ref={seoDialogRef} className={styles.dialog} aria-label="Для поиска" onClose={() => setSeoOpen(false)}>
          <div className={styles.dialogBody}>
            <h2>Для поиска</h2>
            <div className={styles.dialogFields}>
              <label>
                Заголовок страницы в поиске
                <input value={draft.seoTitle} onChange={(event) => onChange({ ...draft, seoTitle: event.target.value })} />
              </label>
              <label>
                Описание страницы в поиске
                <textarea value={draft.seoDescription} onChange={(event) => onChange({ ...draft, seoDescription: event.target.value })} />
              </label>
            </div>
            <button type="button" onClick={() => { dismissDialog(seoDialogRef.current); setSeoOpen(false); }}>Закрыть</button>
          </div>
        </dialog>
      ) : null}
      {copyNote ? <p className={styles.copyNote} role="alert">{copyNote}</p> : null}
      <div className={styles.frame}>
        <header className={styles.hero}>
          <div className={styles.eyebrow}>
            <EditableText label="Надзаголовок" value={draft.hero.eyebrow} onChange={(eyebrow) => onChange({ ...draft, hero: { ...draft.hero, eyebrow } })} />
          </div>
          <div className={styles.heroTitle}>
            <EditableText label="Заголовок" value={draft.hero.title} onChange={(title) => onChange({ ...draft, hero: { ...draft.hero, title } })} />
          </div>
          <div className={styles.lead}>
            <EditableText label="Лид" value={draft.hero.lead} multiline onChange={(lead) => onChange({ ...draft, hero: { ...draft.hero, lead } })} />
          </div>
          <ImageSlot
            image={draft.hero.image}
            label="Изображение шапки"
            frame={PAGE_IMAGE_FRAMES.pageHero}
            onChange={(image) => onChange({ ...draft, hero: { ...draft.hero, image } })}
          />
        </header>

        {draft.notice ? (
          <div className={styles.notice}>
            <EditableText
              label="Уведомление"
              value={draft.notice.body}
              multiline
              onChange={(body) => onChange({ ...draft, notice: { body } })}
            />
          </div>
        ) : null}

        {draft.featuresHeading != null || (draft.features ?? []).length > 0 ? (
          <EditableText
            label="Заголовок списка"
            value={draft.featuresHeading ?? ""}
            prominent={styles.chapterTitle}
            onChange={(featuresHeading) => onChange({ ...draft, featuresHeading })}
          />
        ) : null}

        {(draft.features ?? []).map((feature) => (
          <ChapterBlock
            key={feature.id}
            title={feature.title}
            text={feature.text}
            startEditing={focusChapterId === feature.id}
            onChange={(next) => onChange({
              ...draft,
              features: draft.features!.map((item) => (item.id === feature.id ? { ...item, title: next.title, text: next.text } : item)),
            })}
            onRemove={() => onChange({ ...draft, features: draft.features!.filter((item) => item.id !== feature.id) })}
          />
        ))}

        {draft.proof ? (
          <article className={styles.chapter}>
            <div className={styles.chapterTitle}>
              <EditableText label="Заголовок подтверждения" value={draft.proof.title} onChange={(title) => onChange({ ...draft, proof: { ...draft.proof!, title } })} />
            </div>
            <div className={styles.chapterText}>
              <EditableText label="Текст подтверждения" value={draft.proof.text} multiline onChange={(text) => onChange({ ...draft, proof: { ...draft.proof!, text } })} />
            </div>
            <ImageSlot
              image={draft.proof.image}
              label="Изображение подтверждения"
              frame={PAGE_IMAGE_FRAMES.proof}
              onChange={(image) => onChange({ ...draft, proof: { ...draft.proof!, image } })}
            />
          </article>
        ) : null}

        {(draft.sections ?? []).map((section) => (
          <ChapterBlock
            key={section.id}
            title={section.heading}
            text={section.body}
            startEditing={focusChapterId === section.id}
            onChange={(next) => onChange({
              ...draft,
              sections: draft.sections!.map((item) => (item.id === section.id ? { ...item, heading: next.title, body: next.text } : item)),
            })}
            onRemove={() => onChange({ ...draft, sections: draft.sections!.filter((item) => item.id !== section.id) })}
          />
        ))}

        {allowsEmptyChapter(draft.id) ? (
          <button type="button" className={styles.emptyRow} onClick={addChapter}>Новая глава</button>
        ) : null}

        {showForm ? <FormFields form={form} onChange={(next) => onChange({ ...draft, form: next })} /> : null}

        {!showForm && primary ? (
          <button type="button" className={styles.linkButton} onClick={() => setLinkTarget("primary")}>{primary.label}</button>
        ) : null}
        {!showForm && secondary ? (
          <button type="button" className={styles.linkButton} onClick={() => setLinkTarget("secondary")}>{secondary.label || "Вторая ссылка"}</button>
        ) : null}
      </div>

      {linkTarget === "primary" && primary ? (
        <LinkDialog
          label={primary.label}
          href={primary.href}
          lockedHref={locked}
          onChange={(next) => patchCta({ label: next.label, href: next.href })}
          onClose={() => setLinkTarget(null)}
        />
      ) : null}
      {linkTarget === "secondary" && secondary ? (
        <LinkDialog
          label={secondary.label}
          href={secondary.href}
          lockedHref={null}
          onChange={(next) => patchCta({ secondaryLabel: next.label, secondaryHref: next.href })}
          onClose={() => setLinkTarget(null)}
        />
      ) : null}
    </div>
  );
}
