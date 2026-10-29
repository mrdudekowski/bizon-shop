"use client";

import { BlockNav, useAdminRole, useAdminSession } from "@/admin/ui/DocumentUI";
import { DocumentReviewFooter } from "@/admin/ui/DocumentReviewFooter";
import { AdminLoading } from "@/admin/ui/AdminLoading";
import { SectionAccessNotice } from "@/admin/ui/SectionAccessNotice";
import { canEditorPerform } from "@/admin/domain/editorPermissions";
import Link from "next/link";

import { useEffect, useRef, useState } from "react";

import { DOCUMENT_STATUS, actionErrorText } from "@/admin/client/actionFeedback";
import { browserAdminClient } from "@/admin/client/localStore";
import {
  LEGAL_PAGE_KEYS,
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
import { DocumentFields } from "@/admin/media/DocumentFields";

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

function isLegalPage(id: string): boolean {
  return (LEGAL_PAGE_KEYS as readonly string[]).includes(id);
}

const MESSENGER_FIELDS = [
  {
    key: "telegram",
    label: "Telegram",
    placeholder: "https://t.me/bizon_tires",
    icon: (
      <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden="true">
        <path d="M21.4 3.4 2.7 10.6c-.8.3-.8 1.4 0 1.7l4.7 1.6 1.8 5.6c.2.6 1 .8 1.4.3l2.6-2.7 4.9 3.6c.6.4 1.5.1 1.7-.7L22.9 4.7c.2-.9-.7-1.6-1.5-1.3ZM9.4 13.7l8.5-5.3c.2-.1.4.1.2.3l-7 6.5-.3 3.2-1.4-4.7Z" />
      </svg>
    ),
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    placeholder: "https://wa.me/79000000000",
    icon: (
      <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden="true">
        <path d="M12 2a9.9 9.9 0 0 0-8.5 15l-1.3 4.8 4.9-1.3A9.9 9.9 0 1 0 12 2Zm5.6 14c-.2.7-1.3 1.3-1.8 1.4-.5.1-1.1.1-1.8-.1a16.4 16.4 0 0 1-5.6-3.7c-1.6-1.8-2.4-3.5-2.4-4.6 0-1.1.6-1.7 1.1-2 .3-.2.7-.2.9-.2h.6c.2 0 .5 0 .7.5.3.6.9 2.1 1 2.3.1.2.1.4 0 .6-.1.2-.2.3-.4.5l-.4.5c-.2.2-.3.4-.1.7.2.4.9 1.5 2 2.4 1.4 1.2 2.5 1.6 2.9 1.8.3.1.6.1.8-.1.2-.3.9-1.1 1.2-1.4.2-.3.5-.3.8-.2.3.1 2 .9 2.3 1.1.3.2.5.3.6.5.1.1.1.8-.1 1.5Z" />
      </svg>
    ),
  },
  {
    key: "max",
    label: "MAX",
    placeholder: "https://max.ru/...",
    icon: (
      <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2.5" y="4" width="19" height="16" rx="4.5" />
        <path d="M6.8 15.5V8.5l5.2 4.4 5.2-4.4v7" />
      </svg>
    ),
  },
  {
    key: "vk",
    label: "VK (ВКонтакте)",
    placeholder: "https://vk.com/bizon_tires",
    icon: (
      <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden="true">
        <path d="M13.2 17.5c-6.2 0-9.8-4.3-9.9-11.4h3.1c.1 5.2 2.4 7.4 4.2 7.9V6.1h2.9v4.5c1.8-.2 3.7-2.2 4.3-4.5h2.9c-.5 2.8-2.5 4.8-3.9 5.6 1.4.7 3.7 2.4 4.5 5.8h-3.2c-.7-2.2-2.4-3.9-4.7-4.1v4.1h-.2Z" />
      </svg>
    ),
  },
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/bizon_tires",
    icon: (
      <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
] as const;

const EMPTY_FOOTER_CONTACT = {
  phone: "",
  email: "",
  address: "",
  telegram: "",
  whatsapp: "",
  max: "",
  vk: "",
  instagram: "",
};

function StubFields({
  draft,
  onChange,
}: {
  draft: StubPageDraft;
  onChange: (next: StubPageDraft) => void;
}) {
  const footerContact = { ...EMPTY_FOOTER_CONTACT, ...(draft.footerContact ?? {}) };
  const patchFooterContact = (patch: Partial<typeof EMPTY_FOOTER_CONTACT>) => {
    onChange({ ...draft, footerContact: { ...footerContact, ...patch } });
  };

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
        onChange={(image) => onChange({ ...draft, hero: { ...draft.hero, image: image ?? null } })}
      />
      {draft.id === "contact" ? (
        <section className={styles.section}>
          <h2>Подвал сайта и мессенджеры</h2>
          <p className="subheading">
            Контактные данные и ссылки на мессенджеры отображаются в подвале (футере) основного сайта и BIZON Shop, а также на странице контактов.
          </p>
          <div className={styles.contactGrid}>
            <label>
              Телефон в подвале
              <input
                type="tel"
                placeholder="+7 (800) 000-00-00"
                value={footerContact.phone}
                onChange={(event) => patchFooterContact({ phone: event.target.value })}
              />
            </label>
            <label>
              Email в подвале
              <input
                type="email"
                placeholder="info@bizon-tires.ru"
                value={footerContact.email}
                onChange={(event) => patchFooterContact({ email: event.target.value })}
              />
            </label>
            <label className={styles.fullWidth}>
              Адрес / география поставок
              <input
                placeholder="Работаем по всей стране — поставки для автопарков."
                value={footerContact.address}
                onChange={(event) => patchFooterContact({ address: event.target.value })}
              />
            </label>
          </div>
          <h3>Мессенджеры и соцсети (иконки в подвале)</h3>
          <div className={styles.messengerGrid}>
            {MESSENGER_FIELDS.map((item) => (
              <label key={item.key} className={styles.messengerField}>
                <span className={styles.messengerLabel}>
                  <span className={styles.messengerIcon}>{item.icon}</span>
                  {item.label}
                </span>
                <input
                  type="url"
                  placeholder={item.placeholder}
                  value={footerContact[item.key]}
                  onChange={(event) => patchFooterContact({ [item.key]: event.target.value })}
                />
              </label>
            ))}
          </div>
        </section>
      ) : null}
      {draft.id !== "contact" ? <section className={styles.section}>
        <h2>Дополнительный контент</h2>
        <label>
          Заголовок списка
          <input value={draft.featuresHeading ?? ""} onChange={(event) => onChange({ ...draft, featuresHeading: event.target.value })} />
        </label>
        {(draft.features ?? []).map((feature, index) => (
          <fieldset className={styles.row} key={feature.id}>
            <legend>Пункт {index + 1}</legend>
            <label>Заголовок пункта<input value={feature.title} onChange={(event) => onChange({ ...draft, features: draft.features!.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item) })} /></label>
            <label>Текст<textarea value={feature.text} onChange={(event) => onChange({ ...draft, features: draft.features!.map((item, itemIndex) => itemIndex === index ? { ...item, text: event.target.value } : item) })} /></label>
            <button type="button" onClick={() => onChange({ ...draft, features: draft.features!.filter((_, itemIndex) => itemIndex !== index) })}>Удалить пункт</button>
          </fieldset>
        ))}
        <button type="button" onClick={() => onChange({ ...draft, features: [...(draft.features ?? []), { id: `feature-${crypto.randomUUID()}`, title: "", text: "" }] })}>Добавить пункт</button>
        {(draft.sections ?? []).map((section, index) => (
          <fieldset className={styles.row} key={section.id}>
            <legend>Раздел {index + 1}</legend>
            <label>Заголовок раздела<input value={section.heading} onChange={(event) => onChange({ ...draft, sections: draft.sections!.map((item, itemIndex) => itemIndex === index ? { ...item, heading: event.target.value } : item) })} /></label>
            <label>Текст раздела<textarea value={section.body} onChange={(event) => onChange({ ...draft, sections: draft.sections!.map((item, itemIndex) => itemIndex === index ? { ...item, body: event.target.value } : item) })} /></label>
            <button type="button" onClick={() => onChange({ ...draft, sections: draft.sections!.filter((_, itemIndex) => itemIndex !== index) })}>Удалить раздел</button>
          </fieldset>
        ))}
        <button type="button" onClick={() => onChange({ ...draft, sections: [...(draft.sections ?? []), { id: `section-${crypto.randomUUID()}`, heading: "", body: "" }] })}>Добавить раздел</button>
        <label>
          Уведомление
          <textarea value={draft.notice?.body ?? ""} onChange={(event) => onChange({ ...draft, notice: { body: event.target.value } })} />
        </label>
        {draft.notice !== undefined ? <button type="button" onClick={() => onChange({ ...draft, notice: null })}>Убрать уведомление</button> : null}
        {draft.proof ? (
          <fieldset className={styles.row}>
            <legend>Блок подтверждения</legend>
            <label>Заголовок<input value={draft.proof.title} onChange={(event) => onChange({ ...draft, proof: { ...draft.proof!, title: event.target.value } })} /></label>
            <label>Текст<textarea value={draft.proof.text} onChange={(event) => onChange({ ...draft, proof: { ...draft.proof!, text: event.target.value } })} /></label>
            <PlacementFields label="Изображение подтверждения" value={draft.proof.image} onChange={(image) => onChange({ ...draft, proof: { ...draft.proof!, image: image ?? null } })} />
            <button type="button" onClick={() => onChange({ ...draft, proof: null })}>Убрать блок подтверждения</button>
          </fieldset>
        ) : <button type="button" onClick={() => onChange({ ...draft, proof: { title: "", text: "", image: null } })}>Добавить блок подтверждения</button>}
        {draft.cta ? (
          <fieldset className={styles.row}>
            <legend>Кнопка страницы</legend>
            <CtaFields label="Основная кнопка" value={draft.cta} onChange={(cta) => onChange({ ...draft, cta: { ...draft.cta!, ...cta } })} />
            <label>Текст второй кнопки<input value={draft.cta.secondaryLabel ?? ""} onChange={(event) => onChange({ ...draft, cta: { ...draft.cta!, secondaryLabel: event.target.value } })} /></label>
            <label>Ссылка второй кнопки<input value={draft.cta.secondaryHref ?? ""} onChange={(event) => onChange({ ...draft, cta: { ...draft.cta!, secondaryHref: event.target.value } })} /></label>
            <button type="button" onClick={() => onChange({ ...draft, cta: null })}>Убрать кнопки страницы</button>
          </fieldset>
        ) : <button type="button" onClick={() => onChange({ ...draft, cta: { label: "", href: "" } })}>Добавить кнопки страницы</button>}
      </section> : null}
      {isLegalPage(draft.id) ? (
        <DocumentFields value={draft.documents} onChange={(documents) => onChange({ ...draft, documents })} />
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
        label="Фон hero"
        value={draft.hero.image}
        onChange={(image) => onChange({ ...draft, hero: { ...draft.hero, image: image ?? null } })}
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
        title="Направления"
        value={draft.directions}
        onChange={(directions) => onChange({ ...draft, directions })}
      />
      <SectionFields
        title="Экспертиза"
        value={draft.expertise}
        onChange={(expertise) => onChange({ ...draft, expertise: { ...draft.expertise, ...expertise } })}
      />
      <PlacementFields
        label="Изображение экспертизы"
        value={draft.expertise.image}
        onChange={(image) => onChange({ ...draft, expertise: { ...draft.expertise, image: image ?? null } })}
      />
      <CtaFields
        label="Кнопка экспертизы"
        value={draft.expertise.cta}
        onChange={(cta) => onChange({ ...draft, expertise: { ...draft.expertise, cta } })}
      />
      <SectionFields
        title="Брендинг"
        value={draft.branding}
        onChange={(branding) => onChange({ ...draft, branding: { ...draft.branding, ...branding } })}
      />
      <CtaFields
        label="Кнопка брендирования"
        value={draft.branding.cta}
        onChange={(cta) => onChange({ ...draft, branding: { ...draft.branding, cta } })}
      />
      <label>
        Подпись сравнения до
        <input value={draft.branding.beforeCaption} onChange={(event) => onChange({ ...draft, branding: { ...draft.branding, beforeCaption: event.target.value } })} />
      </label>
      <label>
        Подпись сравнения после
        <input value={draft.branding.afterCaption} onChange={(event) => onChange({ ...draft, branding: { ...draft.branding, afterCaption: event.target.value } })} />
      </label>
      <PlacementFields
        label="Фото до брендирования"
        value={draft.branding.beforeImage}
        onChange={(beforeImage) => onChange({ ...draft, branding: { ...draft.branding, beforeImage: beforeImage ?? null } })}
      />
      <PlacementFields
        label="Фото после брендирования"
        value={draft.branding.afterImage}
        onChange={(afterImage) => onChange({ ...draft, branding: { ...draft.branding, afterImage: afterImage ?? null } })}
      />
      <SectionFields
        title="Кампания магазина"
        value={draft.shopCampaign}
        onChange={(shopCampaign) => onChange({ ...draft, shopCampaign: { ...draft.shopCampaign, ...shopCampaign } })}
      />
      <PlacementFields
        label="Картинка кампании"
        value={draft.shopCampaign.image}
        onChange={(image) => onChange({ ...draft, shopCampaign: { ...draft.shopCampaign, image: image ?? null } })}
      />
      {(draft.shopCampaign.frames ?? []).map((frame, index) => (
        <div key={`${frame.assetId}-${index}`}>
          <PlacementFields
            label={`Кадр ${index + 1}`}
            value={frame}
            onChange={(image) => {
              const frames = (draft.shopCampaign.frames ?? []).slice();
              if (!image) frames.splice(index, 1);
              else frames[index] = image;
              onChange({ ...draft, shopCampaign: { ...draft.shopCampaign, frames } });
            }}
          />
          <button
            type="button"
            onClick={() => onChange({
              ...draft,
              shopCampaign: {
                ...draft.shopCampaign,
                frames: (draft.shopCampaign.frames ?? []).filter((_, frameIndex) => frameIndex !== index),
              },
            })}
          >
            Убрать кадр
          </button>
        </div>
      ))}
      <PlacementFields
        label="Следующий кадр"
        value={null}
        onChange={(image) => {
          if (!image) return;
          onChange({
            ...draft,
            shopCampaign: { ...draft.shopCampaign, frames: [...(draft.shopCampaign.frames ?? []), image] },
          });
        }}
      />
      <CtaFields
        label="Кнопка кампании"
        value={draft.shopCampaign.cta}
        onChange={(cta) => onChange({ ...draft, shopCampaign: { ...draft.shopCampaign, cta } })}
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
        onChange={(image) => onChange({ ...draft, hero: { ...draft.hero, image: image ?? null } })}
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
                slides[index] = { ...slide, image: image ?? null };
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
      setMessage(DOCUMENT_STATUS.saved);
    } catch (error) {
      setMessage(actionErrorText(error, "Не удалось сохранить"));
    } finally {
      setSaving(false);
    }
  }

  async function onPublish() {
    setPublishing(true);
    setMessage("");
    try {
      setRecord(await browserAdminClient().publishPage(pageKey));
      setMessage(DOCUMENT_STATUS.published);
    } catch (error) {
      setMessage(actionErrorText(error, "Не удалось опубликовать"));
    } finally {
      setPublishing(false);
    }
  }

  async function onReset() {
    resetDialogRef.current?.close();
    try {
      setRecord(await browserAdminClient().resetPage(pageKey));
      setMessage(DOCUMENT_STATUS.saved);
    } catch (error) {
      setMessage(actionErrorText(error, "Не удалось сбросить страницу"));
    }
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
