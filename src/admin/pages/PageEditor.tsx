"use client";

import { BlockNav, useAdminRole, useAdminSession } from "@/admin/ui/DocumentUI";
import { DocumentReviewFooter } from "@/admin/ui/DocumentReviewFooter";
import { AdminLoading } from "@/admin/ui/AdminLoading";
import { SectionAccessNotice } from "@/admin/ui/SectionAccessNotice";
import { canEditorPerform } from "@/admin/domain/editorPermissions";
import Link from "next/link";

import { useEffect, useRef, useState } from "react";

import { AdminClientError } from "@/admin/client/errors";
import { ERROR_TEXT } from "@/admin/client/errorText";
import { browserAdminClient } from "@/admin/client/localStore";
import {
  LEGAL_PAGE_KEYS,
  type DocumentLink,
  type EntityRecord,
  type HomePageDraft,
  type PageCta,
  type PageDraft,
  type PageKey,
  type PageSectionCopy,
  type ShopHomePageDraft,
  type StubPageDraft,
} from "@/admin/domain/types";
import { PlacementFields } from "@/admin/media/PlacementFields";

import { PAGE_LABELS } from "./pageLabels";
import styles from "./PageEditor.module.css";

function SectionFields({
  value,
  onChange,
  title,
}: {
  value: PageSectionCopy;
  onChange: (next: PageSectionCopy) => void;
  title: string;
}) {
  return (
    <section className={styles.section}>
      <h2>{title}</h2>
      <label>
        Надзаголовок
        <input
          value={value.eyebrow}
          onChange={(event) => onChange({ ...value, eyebrow: event.target.value })}
        />
      </label>
      <label>
        Заголовок
        <input value={value.title} onChange={(event) => onChange({ ...value, title: event.target.value })} />
      </label>
      <label>
        Лид
        <textarea value={value.lead} onChange={(event) => onChange({ ...value, lead: event.target.value })} />
      </label>
    </section>
  );
}

function CtaFields({
  value,
  onChange,
  label,
}: {
  value: PageCta;
  onChange: (next: PageCta) => void;
  label: string;
}) {
  return (
    <fieldset className={styles.cta}>
      <legend>{label}</legend>
      <label>
        Текст
        <input
          value={value.label}
          onChange={(event) => onChange({ ...value, label: event.target.value })}
        />
      </label>
      <label>
        Ссылка
        <input value={value.href} onChange={(event) => onChange({ ...value, href: event.target.value })} />
      </label>
    </fieldset>
  );
}

function moveDocument(documents: DocumentLink[], index: number, delta: number): DocumentLink[] {
  const target = index + delta;
  if (target < 0 || target >= documents.length) return documents;
  const next = documents.slice();
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

function isLegalPage(id: string): boolean {
  return (LEGAL_PAGE_KEYS as readonly string[]).includes(id);
}

function StubFields({
  draft,
  onChange,
}: {
  draft: StubPageDraft;
  onChange: (next: StubPageDraft) => void;
}) {
  async function onDocumentFile(file: File | undefined) {
    if (file == null) return;
    const asset = await browserAdminClient().createAsset({
      name: file.name,
      mimeType: file.type || "application/pdf",
      body: file,
    });
    onChange({ ...draft, documents: [...draft.documents, { assetId: asset.id, title: file.name }] });
  }

  return (
    <>
      <SectionFields
        title="Шапка"
        value={draft.hero}
        onChange={(hero) => onChange({ ...draft, hero: { ...draft.hero, ...hero } })}
      />
      <PlacementFields
        label="Картинка шапки"
        value={draft.hero.image}
        onChange={(image) => onChange({ ...draft, hero: { ...draft.hero, image } })}
      />
      {isLegalPage(draft.id) ? (
        <section className={styles.section}>
          <h2>Документы</h2>
          {draft.documents.map((doc, index) => (
            <div key={`${doc.assetId}-${index}`} className={styles.row}>
              <label>
                Название
                <input
                  value={doc.title}
                  onChange={(event) => {
                    const documents = draft.documents.slice();
                    documents[index] = { ...doc, title: event.target.value };
                    onChange({ ...draft, documents });
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => onChange({ ...draft, documents: draft.documents.filter((_, itemIndex) => itemIndex !== index) })}
              >
                Убрать
              </button>
              <button type="button" onClick={() => onChange({ ...draft, documents: moveDocument(draft.documents, index, -1) })}>
                выше
              </button>
              <button type="button" onClick={() => onChange({ ...draft, documents: moveDocument(draft.documents, index, 1) })}>
                ниже
              </button>
            </div>
          ))}
          <label>
            PDF
            <input
              type="file"
              accept="application/pdf"
              onChange={(event) => {
                void onDocumentFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
        </section>
      ) : null}
    </>
  );
}

function HomeFields({
  draft,
  onChange,
}: {
  draft: HomePageDraft;
  onChange: (next: HomePageDraft) => void;
}) {
  return (
    <>
      <SectionFields
        title="Hero"
        value={draft.hero}
        onChange={(hero) => onChange({ ...draft, hero: { ...draft.hero, ...hero } })}
      />
      <PlacementFields
        label="Картинка hero"
        value={draft.hero.image}
        onChange={(image) => onChange({ ...draft, hero: { ...draft.hero, image } })}
      />
      <CtaFields
        label="Основная кнопка"
        value={draft.hero.primaryCta}
        onChange={(primaryCta) => onChange({ ...draft, hero: { ...draft.hero, primaryCta } })}
      />
      <CtaFields
        label="Вторая кнопка"
        value={draft.hero.secondaryCta}
        onChange={(secondaryCta) => onChange({ ...draft, hero: { ...draft.hero, secondaryCta } })}
      />
      <label>
        Метрика — подпись
        <input
          value={draft.hero.metricLabel}
          onChange={(event) => onChange({ ...draft, hero: { ...draft.hero, metricLabel: event.target.value } })}
        />
      </label>
      <label>
        Метрика — текст
        <input
          value={draft.hero.metricText}
          onChange={(event) => onChange({ ...draft, hero: { ...draft.hero, metricText: event.target.value } })}
        />
      </label>
      <SectionFields
        title="Подбор"
        value={draft.selectionEntry}
        onChange={(selectionEntry) => onChange({ ...draft, selectionEntry: { ...draft.selectionEntry, ...selectionEntry } })}
      />
      <PlacementFields
        label="Фон секции подбора"
        value={draft.selectionEntry.image}
        onChange={(image) => onChange({ ...draft, selectionEntry: { ...draft.selectionEntry, image } })}
      />
      <SectionFields
        title="Направления"
        value={draft.directions}
        onChange={(directions) => onChange({ ...draft, directions })}
      />
      <SectionFields
        title="Экспертиза"
        value={draft.expertise}
        onChange={(expertise) => onChange({ ...draft, expertise })}
      />
      <SectionFields
        title="Кампания магазина"
        value={draft.shopCampaign}
        onChange={(shopCampaign) => onChange({ ...draft, shopCampaign: { ...draft.shopCampaign, ...shopCampaign } })}
      />
      <PlacementFields
        label="Картинка кампании"
        value={draft.shopCampaign.image}
        onChange={(image) => onChange({ ...draft, shopCampaign: { ...draft.shopCampaign, image } })}
      />
      <CtaFields
        label="Кнопка кампании"
        value={draft.shopCampaign.cta}
        onChange={(cta) => onChange({ ...draft, shopCampaign: { ...draft.shopCampaign, cta } })}
      />
      <SectionFields
        title="Резюме"
        value={draft.resume}
        onChange={(resume) => onChange({ ...draft, resume: { ...draft.resume, ...resume } })}
      />
      <CtaFields
        label="Основная кнопка резюме"
        value={draft.resume.primaryCta}
        onChange={(primaryCta) => onChange({ ...draft, resume: { ...draft.resume, primaryCta } })}
      />
      <CtaFields
        label="Вторая кнопка резюме"
        value={draft.resume.secondaryCta}
        onChange={(secondaryCta) => onChange({ ...draft, resume: { ...draft.resume, secondaryCta } })}
      />
    </>
  );
}

function ShopHomeFields({
  draft,
  onChange,
}: {
  draft: ShopHomePageDraft;
  onChange: (next: ShopHomePageDraft) => void;
}) {
  return (
    <>
      <SectionFields
        title="Hero"
        value={draft.hero}
        onChange={(hero) => onChange({ ...draft, hero: { ...draft.hero, ...hero } })}
      />
      <PlacementFields
        label="Картинка hero"
        value={draft.hero.image}
        onChange={(image) => onChange({ ...draft, hero: { ...draft.hero, image } })}
      />
      <CtaFields
        label="Кнопка hero"
        value={draft.hero.cta}
        onChange={(cta) => onChange({ ...draft, hero: { ...draft.hero, cta } })}
      />
      <SectionFields
        title="Ввод дисков"
        value={draft.wheelsIntro}
        onChange={(wheelsIntro) => onChange({ ...draft, wheelsIntro: { ...draft.wheelsIntro, ...wheelsIntro } })}
      />
      <label>
        Kicker
        <input
          value={draft.wheelsIntro.kicker}
          onChange={(event) =>
            onChange({ ...draft, wheelsIntro: { ...draft.wheelsIntro, kicker: event.target.value } })
          }
        />
      </label>

      <section className={styles.section}>
        <h2>Шаги заказа</h2>
        {draft.orderSteps.map((step, index) => (
          <div key={step.id} className={styles.row}>
            <label>
              Заголовок
              <input
                value={step.title}
                onChange={(event) => {
                  const orderSteps = draft.orderSteps.slice();
                  orderSteps[index] = { ...step, title: event.target.value };
                  onChange({ ...draft, orderSteps });
                }}
              />
            </label>
            <label>
              Описание
              <textarea
                value={step.description}
                onChange={(event) => {
                  const orderSteps = draft.orderSteps.slice();
                  orderSteps[index] = { ...step, description: event.target.value };
                  onChange({ ...draft, orderSteps });
                }}
              />
            </label>
            <button
              type="button"
              onClick={() =>
                onChange({ ...draft, orderSteps: draft.orderSteps.filter((row) => row.id !== step.id) })
              }
            >
              Убрать
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange({
              ...draft,
              orderSteps: [...draft.orderSteps, { id: crypto.randomUUID(), title: "", description: "" }],
            })
          }
        >
          Добавить шаг
        </button>
      </section>

      <section className={styles.section}>
        <h2>Карусель категорий</h2>
        {draft.categoryCarousel.map((slide, index) => (
          <div key={slide.id} className={styles.row}>
            <label>
              Kicker
              <input
                value={slide.kicker}
                onChange={(event) => {
                  const categoryCarousel = draft.categoryCarousel.slice();
                  categoryCarousel[index] = { ...slide, kicker: event.target.value };
                  onChange({ ...draft, categoryCarousel });
                }}
              />
            </label>
            <label>
              Заголовок
              <input
                value={slide.title}
                onChange={(event) => {
                  const categoryCarousel = draft.categoryCarousel.slice();
                  categoryCarousel[index] = { ...slide, title: event.target.value };
                  onChange({ ...draft, categoryCarousel });
                }}
              />
            </label>
            <label>
              Действие
              <input
                value={slide.action}
                onChange={(event) => {
                  const categoryCarousel = draft.categoryCarousel.slice();
                  categoryCarousel[index] = { ...slide, action: event.target.value };
                  onChange({ ...draft, categoryCarousel });
                }}
              />
            </label>
            <label>
              Ссылка
              <input
                value={slide.href}
                onChange={(event) => {
                  const categoryCarousel = draft.categoryCarousel.slice();
                  categoryCarousel[index] = { ...slide, href: event.target.value };
                  onChange({ ...draft, categoryCarousel });
                }}
              />
            </label>
            <label>
              Alt
              <input
                value={slide.alt}
                onChange={(event) => {
                  const categoryCarousel = draft.categoryCarousel.slice();
                  categoryCarousel[index] = { ...slide, alt: event.target.value };
                  onChange({ ...draft, categoryCarousel });
                }}
              />
            </label>
            <PlacementFields
              label="Desktop"
              value={slide.desktopImage}
              onChange={(desktopImage) => {
                const categoryCarousel = draft.categoryCarousel.slice();
                categoryCarousel[index] = { ...slide, desktopImage };
                onChange({ ...draft, categoryCarousel });
              }}
            />
            <PlacementFields
              label="Mobile"
              value={slide.mobileImage}
              onChange={(mobileImage) => {
                const categoryCarousel = draft.categoryCarousel.slice();
                categoryCarousel[index] = { ...slide, mobileImage };
                onChange({ ...draft, categoryCarousel });
              }}
            />
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...draft,
                  categoryCarousel: draft.categoryCarousel.filter((row) => row.id !== slide.id),
                })
              }
            >
              Убрать
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange({
              ...draft,
              categoryCarousel: [
                ...draft.categoryCarousel,
                {
                  id: crypto.randomUUID(),
                  kicker: "",
                  title: "",
                  action: "",
                  href: "",
                  alt: "",
                },
              ],
            })
          }
        >
          Добавить слайд категории
        </button>
      </section>

      <SectionFields
        title="Техника"
        value={draft.vehicles}
        onChange={(vehicles) => onChange({ ...draft, vehicles: { ...draft.vehicles, ...vehicles } })}
      />
      <CtaFields
        label="Кнопка техники"
        value={draft.vehicles.cta}
        onChange={(cta) => onChange({ ...draft, vehicles: { ...draft.vehicles, cta } })}
      />
      <section className={styles.section}>
        <h2>Слайды техники</h2>
        {draft.vehicles.slides.map((slide, index) => (
          <div key={slide.id} className={styles.row}>
            <label>
              Заголовок
              <input
                value={slide.title}
                onChange={(event) => {
                  const slides = draft.vehicles.slides.slice();
                  slides[index] = { ...slide, title: event.target.value };
                  onChange({ ...draft, vehicles: { ...draft.vehicles, slides } });
                }}
              />
            </label>
            <label>
              Alt
              <input
                value={slide.alt}
                onChange={(event) => {
                  const slides = draft.vehicles.slides.slice();
                  slides[index] = { ...slide, alt: event.target.value };
                  onChange({ ...draft, vehicles: { ...draft.vehicles, slides } });
                }}
              />
            </label>
            <PlacementFields
              label="Картинка"
              value={slide.image}
              onChange={(image) => {
                const slides = draft.vehicles.slides.slice();
                slides[index] = { ...slide, image };
                onChange({ ...draft, vehicles: { ...draft.vehicles, slides } });
              }}
            />
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...draft,
                  vehicles: {
                    ...draft.vehicles,
                    slides: draft.vehicles.slides.filter((row) => row.id !== slide.id),
                  },
                })
              }
            >
              Убрать
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange({
              ...draft,
              vehicles: {
                ...draft.vehicles,
                slides: [...draft.vehicles.slides, { id: crypto.randomUUID(), title: "", alt: "" }],
              },
            })
          }
        >
          Добавить слайд техники
        </button>
      </section>
    </>
  );
}

export function PageEditor({ pageKey }: { pageKey: PageKey }) {
  const session = useAdminSession();
  const [record, setRecord] = useState<EntityRecord<PageDraft> | null>(null);
  const [role, setRole] = useAdminRole();
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const resetDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const client = browserAdminClient();
    void Promise.all([client.getSession(), client.getPage(pageKey)]).then(([session, page]) => {
      setRole(session.role);
      setRecord(page);
    });
  }, [pageKey, setRole]);

  if (session == null || record == null) return <main><AdminLoading /></main>;
  if (!canEditorPerform(session, "edit_site_pages")) return <SectionAccessNotice title="Страницы" icon="pages" />;
  const draft = record.draft;
  const dirty = JSON.stringify(draft) !== JSON.stringify(record.savedDraft);

  function setDraft(next: PageDraft) {
    setRecord({ ...record!, draft: next });
  }

  async function onSave() {
    setSaving(true);
    setMessage("");
    try {
      setRecord(await browserAdminClient().savePage(pageKey, draft));
    } catch (error) {
      setMessage(error instanceof AdminClientError ? ERROR_TEXT[error.code] : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  async function onPublish() {
    setPublishing(true);
    setMessage("");
    try {
      setRecord(await browserAdminClient().publishPage(pageKey));
    } catch (error) {
      setMessage(error instanceof AdminClientError ? ERROR_TEXT[error.code] : "Не удалось опубликовать");
    } finally {
      setPublishing(false);
    }
  }

  async function onReset() {
    resetDialogRef.current?.close();
    setRecord(await browserAdminClient().resetPage(pageKey));
  }

  return (
    <main className="document" data-unsaved={dirty ? "true" : undefined}>
      <Link className="backLink" href="/pages">← Назад к страницам</Link>
      <h1>{PAGE_LABELS[pageKey]}</h1>
      {draft.id === "home" || draft.id === "shop-home" ? <BlockNav /> : null}
      <section className={styles.section}>
        <h2>Для поиска</h2>
        <label>
          Заголовок страницы в поиске
          <input value={draft.seoTitle} onChange={(event) => setDraft({ ...draft, seoTitle: event.target.value })} />
        </label>
        <label>
          Описание страницы в поиске
          <textarea value={draft.seoDescription} onChange={(event) => setDraft({ ...draft, seoDescription: event.target.value })} />
        </label>
      </section>

      {draft.id === "home" ? (
        <HomeFields draft={draft} onChange={setDraft} />
      ) : draft.id === "shop-home" ? (
        <ShopHomeFields draft={draft} onChange={setDraft} />
      ) : (
        <StubFields draft={draft} onChange={setDraft} />
      )}

      <DocumentReviewFooter
        entityType="page"
        entityId={pageKey}
        dirty={dirty}
        saving={saving}
        message={message}
        lastSavedBy={record.lastSavedBy}
        lastPublishedBy={record.lastPublishedBy}
        onSave={onSave}
        adminActions={
          <>
            <button type="button" disabled={dirty || publishing} onClick={() => void onPublish()}>
              {publishing ? "Публикуем…" : "Опубликовать"}
            </button>
            <button type="button" onClick={() => resetDialogRef.current?.showModal()}>
              Сбросить опубликованный текст
            </button>
            <dialog ref={resetDialogRef}>
              <p>Сбросить опубликованный текст? На сайте снова будет текст из кода.</p>
              <div className={styles.actions}>
                <button type="button" onClick={() => void onReset()}>
                  Сбросить
                </button>
                <button type="button" onClick={() => resetDialogRef.current?.close()}>
                  Отмена
                </button>
              </div>
            </dialog>
          </>
        }
      />
    </main>
  );
}
