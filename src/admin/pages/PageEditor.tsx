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
  PAGE_FORM_KEYS,
  type EntityRecord,
  type HomePageDraft,
  type PageCta,
  type PageDraft,
  type PageFormDraft,
  type PageKey,
  type PageSectionCopy,
  type ShopHomePageDraft,
  type SiteProfileDraft,
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

const EMPTY_PAGE_FORM: PageFormDraft = { successMessage: "", fields: [] };

const FIELD_TYPE_LABELS: Record<PageFormDraft["fields"][number]["type"], string> = {
  text: "Текст",
  tel: "Телефон",
  email: "Email",
  url: "Ссылка",
  textarea: "Многострочный текст",
  file: "Файл",
};

const EMPTY_SITE_PROFILE: SiteProfileDraft = { phone: "", email: "", address: "", channels: [], legalSummary: "", requisites: [] };

function mergeSiteProfileDraft(raw: SiteProfileDraft | undefined): SiteProfileDraft {
  return {
    ...EMPTY_SITE_PROFILE,
    ...(raw ?? {}),
    legalSummary: raw?.legalSummary ?? "",
    requisites: raw?.requisites ?? [],
    channels: raw?.channels ?? [],
  };
}

function StubFields({
  draft,
  onChange,
}: {
  draft: StubPageDraft;
  onChange: (next: StubPageDraft) => void;
}) {
  const siteProfile = mergeSiteProfileDraft(draft.siteProfile);
  const patchSiteProfile = (patch: Partial<SiteProfileDraft>) => {
    onChange({ ...draft, siteProfile: { ...siteProfile, ...patch } });
  };
  const patchChannel = (index: number, patch: Partial<SiteProfileDraft["channels"][number]>) => {
    patchSiteProfile({ channels: siteProfile.channels.map((channel, channelIndex) => (channelIndex === index ? { ...channel, ...patch } : channel)) });
  };
  const form = draft.form ?? EMPTY_PAGE_FORM;
  const patchForm = (patch: Partial<PageFormDraft>) => onChange({ ...draft, form: { ...form, ...patch } });
  const patchFormField = (index: number, patch: Partial<PageFormDraft["fields"][number]>) => {
    patchForm({ fields: form.fields.map((field, fieldIndex) => (fieldIndex === index ? { ...field, ...patch } : field)) });
  };
  const patchRequisite = (index: number, patch: Partial<SiteProfileDraft["requisites"][number]>) => {
    patchSiteProfile({ requisites: siteProfile.requisites.map((requisite, requisiteIndex) => (requisiteIndex === index ? { ...requisite, ...patch } : requisite)) });
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
            Контактные данные и ссылки на каналы связи отображаются в подвале (футере) основного сайта и BIZON Shop, а также на странице контактов. Канал без ссылки или с выключенным показом на сайте скрыт.
          </p>
          <div className={styles.contactGrid}>
            <label>
              Телефон
              <input
                type="tel"
                placeholder="+7 (800) 000-00-00"
                value={siteProfile.phone}
                onChange={(event) => patchSiteProfile({ phone: event.target.value })}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                placeholder="info@bizon-tires.ru"
                value={siteProfile.email}
                onChange={(event) => patchSiteProfile({ email: event.target.value })}
              />
            </label>
            <label className={styles.fullWidth}>
              Адрес
              <input
                value={siteProfile.address}
                onChange={(event) => patchSiteProfile({ address: event.target.value })}
              />
            </label>
          </div>
          <label className={styles.fullWidth}>
            Краткое описание реквизитов
            <textarea
              value={siteProfile.legalSummary}
              onChange={(event) => patchSiteProfile({ legalSummary: event.target.value })}
            />
          </label>
          <h3>Юридические реквизиты</h3>
          {siteProfile.requisites.map((requisite, index) => (
            <fieldset className={styles.row} key={requisite.id}>
              <legend>{requisite.label || "Новый реквизит"}</legend>
              <label>
                Подпись
                <input value={requisite.label} onChange={(event) => patchRequisite(index, { label: event.target.value })} />
              </label>
              <label>
                Значение
                <textarea value={requisite.value} onChange={(event) => patchRequisite(index, { value: event.target.value })} />
              </label>
              <button
                type="button"
                onClick={() => patchSiteProfile({ requisites: siteProfile.requisites.filter((_, requisiteIndex) => requisiteIndex !== index) })}
              >
                Удалить реквизит
              </button>
            </fieldset>
          ))}
          <button
            type="button"
            onClick={() =>
              patchSiteProfile({
                requisites: [...siteProfile.requisites, { id: `requisite-${crypto.randomUUID()}`, label: "", value: "" }],
              })
            }
          >
            Добавить реквизит
          </button>
          <h3>Каналы связи (мессенджеры и соцсети)</h3>
          {siteProfile.channels.map((channel, index) => (
            <fieldset className={styles.row} key={channel.id}>
              <legend>{channel.label || "Новый канал"}</legend>
              <label>
                Название
                <input value={channel.label} onChange={(event) => patchChannel(index, { label: event.target.value })} />
              </label>
              <label>
                Ссылка
                <input
                  type="url"
                  placeholder="https://t.me/bizon_tires"
                  value={channel.href}
                  onChange={(event) => patchChannel(index, { href: event.target.value })}
                />
              </label>
              <label className={styles.checkboxField}>
                <input
                  type="checkbox"
                  checked={channel.enabled}
                  onChange={(event) => patchChannel(index, { enabled: event.target.checked })}
                />
                Показывать
              </label>
              <button
                type="button"
                onClick={() => patchSiteProfile({ channels: siteProfile.channels.filter((_, channelIndex) => channelIndex !== index) })}
              >
                Удалить канал
              </button>
            </fieldset>
          ))}
          <button
            type="button"
            onClick={() => patchSiteProfile({ channels: [...siteProfile.channels, { id: `channel-${crypto.randomUUID()}`, label: "", href: "", enabled: true }] })}
          >
            Добавить канал
          </button>        </section>
      ) : null}
      {(PAGE_FORM_KEYS as readonly string[]).includes(draft.id) ? (
        <section className={styles.section}>
          <h2>Форма заявки</h2>
          <label>
            Текст после отправки
            <textarea value={form.successMessage} onChange={(event) => patchForm({ successMessage: event.target.value })} />
          </label>
          {form.fields.map((field, index) => (
            <fieldset className={styles.row} key={field.id}>
              <legend>{field.label || "Новое поле"}</legend>
              <label>
                Название поля
                <input value={field.label} onChange={(event) => patchFormField(index, { label: event.target.value })} />
              </label>
              <label>
                Тип поля
                <select
                  value={field.type}
                  onChange={(event) => patchFormField(index, { type: event.target.value as typeof field.type })}
                >
                  {Object.entries(FIELD_TYPE_LABELS).map(([type, label]) => (
                    <option key={type} value={type}>{label}</option>
                  ))}
                </select>
              </label>
              <label className={styles.checkboxField}>
                <input type="checkbox" checked={field.required} onChange={(event) => patchFormField(index, { required: event.target.checked })} />
                Обязательное
              </label>
              <button type="button" onClick={() => patchForm({ fields: form.fields.filter((_, fieldIndex) => fieldIndex !== index) })}>
                Удалить поле
              </button>
            </fieldset>
          ))}
          <button
            type="button"
            onClick={() => patchForm({ fields: [...form.fields, { id: `field-${crypto.randomUUID()}`, label: "", type: "text", required: false }] })}
          >
            Добавить поле
          </button>
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
