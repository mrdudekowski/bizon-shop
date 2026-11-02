"use client";

import { useEffect, useRef, useState } from "react";

import { submitRequest } from "@/lib/requests/submitRequest";
import { HONEYPOT_FIELD } from "@/lib/requests/validateRequest";

import styles from "./ConfiguredForm.module.css";

/** Copy of the backend `PageForm` shape. The site must not import from `backend-app`. */
export type FormFieldType = "text" | "tel" | "email" | "url" | "textarea";

const TEXT_FIELD_TYPES = new Set<string>(["text", "tel", "email", "url", "textarea"]);

export type PageFormField = {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
};

export type ConfiguredSourceForm =
  | "supplier"
  | "shop_supplier"
  | "delivery_quote"
  | "shop_delivery"
  | "branding"
  | "warranty"
  | "shop_warranty";

export type PageForm = {
  pageKey:
    | "become-a-supplier"
    | "shop-become-a-supplier"
    | "delivery"
    | "delivery-geography"
    | "shop-delivery"
    | "branding"
    | "warranty"
    | "shop-warranty";
  successMessage: string;
  submitLabel?: string;
  fields: PageFormField[];
};

export function ConfiguredFormSuccess({ message }: { message: string }) {
  const statusRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    statusRef.current?.focus();
  }, []);
  return (
    <p
      ref={statusRef}
      id="configured-form-success"
      className={styles.success}
      role="status"
      aria-live="polite"
      tabIndex={-1}
    >
      {message}
    </p>
  );
}

export function ConfiguredForm({
  form,
  sourceForm,
}: {
  form: PageForm;
  sourceForm: ConfiguredSourceForm;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (new FormData(event.currentTarget).get(HONEYPOT_FIELD)) return;
    setStatus("loading");
    setError("");
    try {
      const result = await submitRequest({ sourceForm, sourcePage: window.location.pathname, body: values });
      setSuccessMessage(result.message);
      setStatus("success");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось отправить заявку");
      setStatus("error");
    }
  }

  if (status === "success") return <ConfiguredFormSuccess message={successMessage} />;

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        type="text"
        name={HONEYPOT_FIELD}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className={styles.honeypot}
      />
      <div className={styles.fields}>
        {form.fields.filter((field) => TEXT_FIELD_TYPES.has(field.type)).map((field) => (
          <label key={field.id} className={field.type === "textarea" ? styles.wideField : styles.field}>
            <span>
              {field.label}
              {field.required ? " *" : ""}
            </span>
            {field.type === "textarea" ? (
              <textarea
                name={field.id}
                rows={4}
                required={field.required}
                value={values[field.id] ?? ""}
                onChange={(event) => setValues((current) => ({ ...current, [field.id]: event.target.value }))}
              />
            ) : (
              <input
                type={field.type}
                name={field.id}
                required={field.required}
                value={values[field.id] ?? ""}
                onChange={(event) => setValues((current) => ({ ...current, [field.id]: event.target.value }))}
              />
            )}
          </label>
        ))}
      </div>
      {status === "error" && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button className="btn-accent" type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Отправка…" : form.submitLabel?.trim() || "Отправить"}
      </button>
    </form>
  );
}
