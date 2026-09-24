"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { RequestContextSummary } from "@/components/selection/RequestContextSummary";
import type { ContactIntent } from "@/lib/requests/contactIntent";
import type { NormalizedSelectionContext } from "@/lib/requests/selectionContext";
import { submitRequest } from "@/lib/requests/submitRequest";
import { HONEYPOT_FIELD } from "@/lib/requests/validateRequest";

import styles from "./ContextualContactForm.module.css";

type FormValues = {
  name: string;
  phone: string;
  email: string;
  company: string;
  comment: string;
  size: string;
  quantity: string;
  axle: string;
  region: string;
  desiredTerm: string;
};
const EMPTY_VALUES: FormValues = {
  name: "",
  phone: "",
  email: "",
  company: "",
  comment: "",
  size: "",
  quantity: "",
  axle: "",
  region: "",
  desiredTerm: "",
};

const DEFAULT_INTENT: ContactIntent = {
  sourceForm: "contact",
  title: "Контакты",
  description: "Расчёт, подбор шин и консультация для fleet-операторов.",
  formEyebrow: "Связаться с BIZON",
  formHeading: "Обсудим вашу задачу",
};

export function ContextualContactForm({
  context,
  intent = DEFAULT_INTENT,
}: {
  context?: NormalizedSelectionContext;
  intent?: ContactIntent;
}) {
  const pathname = usePathname();
  const isProcurement = intent.subject === "procurement";
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState<string | number>();

  const setValue = (key: keyof FormValues, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (formData.get(HONEYPOT_FIELD)) return;
    setStatus("loading");
    setError("");
    try {
      const result = await submitRequest({
        sourceForm: intent.sourceForm,
        sourcePage: pathname || "/contact",
        body: {
          name: values.name,
          phone: values.phone,
          email: values.email,
          companyName: values.company,
          message: values.comment,
          ...(isProcurement
            ? {
                message: [
                  `Типоразмер: ${values.size}`,
                  `Количество: ${values.quantity}`,
                  `Ось: ${values.axle}`,
                  `Регион: ${values.region}`,
                  `Желаемый срок: ${values.desiredTerm}`,
                  `Комментарий: ${values.comment}`,
                ].join("\n"),
              }
            : {}),
          ...(context ? { selectionContext: context } : {}),
        },
      });
      setRequestId(result.requestId);
      setStatus("success");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось отправить заявку");
      setStatus("error");
    }
  }

  if (status === "success" && requestId != null) {
    return (
      <div className={styles.confirmation}>
        <p className={styles.eyebrow}>Запрос зарегистрирован</p>
        <h2>Заявка {requestId} принята</h2>
        <p>
          Специалист BIZON получил ваши контакты и контекст. Следующий шаг — проверить задачу и
          связаться с вами.
        </p>
        <dl>
          <div>
            <dt>Имя</dt>
            <dd>{values.name}</dd>
          </div>
          {values.phone && (
            <div>
              <dt>Телефон</dt>
              <dd>{values.phone}</dd>
            </div>
          )}
          {values.email && (
            <div>
              <dt>Email</dt>
              <dd>{values.email}</dd>
            </div>
          )}
          {intent.summaryLabel && (
            <div>
              <dt>Тема</dt>
              <dd>{intent.summaryLabel}</dd>
            </div>
          )}
        </dl>
        <div className={styles.confirmationLinks}>
          {context?.modelSlugs.map((slug) => (
            <Link key={slug} href={`/models/tbr/${slug}`}>
              Модель {slug}
            </Link>
          ))}
          <Link href="/models">Вернуться в каталог</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      {context ? <RequestContextSummary context={context} /> : null}
      {!context && intent.summaryLabel ? (
        <aside className={styles.intentSummary} aria-label="Контекст заявки">
          <p className={styles.eyebrow}>Контекст</p>
          <p>
            <strong>{intent.summaryLabel}</strong>
          </p>
        </aside>
      ) : null}
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="text"
          name={HONEYPOT_FIELD}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className={styles.honeypot}
        />
        <div className={styles.formIntro}>
          <p className={styles.eyebrow}>{intent.formEyebrow}</p>
          <h2>{intent.formHeading}</h2>
          <p>Телефон или Email — достаточно одного способа связи.</p>
        </div>
        <div className={styles.fieldGrid}>
          {isProcurement ? (
            <>
              <label>
                <span>Типоразмер *</span>
                <input name="size" required placeholder="315/80 R22.5" value={values.size} onChange={(event) => setValue("size", event.target.value)} />
              </label>
              <label>
                <span>Количество *</span>
                <input name="quantity" required type="number" min="1" inputMode="numeric" value={values.quantity} onChange={(event) => setValue("quantity", event.target.value)} />
              </label>
              <label>
                <span>Ось</span>
                <input name="axle" placeholder="Ведущая / прицепная" value={values.axle} onChange={(event) => setValue("axle", event.target.value)} />
              </label>
              <label>
                <span>Регион</span>
                <input name="region" autoComplete="address-level1" value={values.region} onChange={(event) => setValue("region", event.target.value)} />
              </label>
              <label>
                <span>Желаемый срок</span>
                <input name="desiredTerm" placeholder="Например, до 15 сентября" value={values.desiredTerm} onChange={(event) => setValue("desiredTerm", event.target.value)} />
              </label>
            </>
          ) : null}
          <label>
            <span>Имя *</span>
            <input
              name="name"
              required
              autoComplete="name"
              value={values.name}
              onChange={(event) => setValue("name", event.target.value)}
            />
          </label>
          <label>
            <span>Компания</span>
            <input
              name="company"
              autoComplete="organization"
              value={values.company}
              onChange={(event) => setValue("company", event.target.value)}
            />
          </label>
          <label>
            <span>Телефон</span>
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={values.phone}
              onChange={(event) => setValue("phone", event.target.value)}
            />
          </label>
          <label>
            <span>Email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={(event) => setValue("email", event.target.value)}
            />
          </label>
        </div>
        <label className={styles.comment}>
          <span>Комментарий</span>
          <textarea
            name="comment"
            rows={4}
            value={values.comment}
            onChange={(event) => setValue("comment", event.target.value)}
          />
        </label>
        {status === "error" && (
          <p className={styles.error} role="alert">
            {error}. Проверьте данные и попробуйте ещё раз.
          </p>
        )}
        <button className="btn-accent" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Отправка…" : "Отправить заявку"}
        </button>
      </form>
    </div>
  );
}
