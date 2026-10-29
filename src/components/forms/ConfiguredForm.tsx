"use client";

import { useState } from "react";

import { publicApiUrl } from "@/lib/publicApi";
import { submitRequest } from "@/lib/requests/submitRequest";
import { HONEYPOT_FIELD } from "@/lib/requests/validateRequest";

import styles from "./ConfiguredForm.module.css";

/** Copy of the backend `PageForm` shape. The site must not import from `backend-app`. */
export type FormFieldType = "text" | "tel" | "email" | "url" | "textarea" | "file";

export type PageFormField = {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
};

export type PageForm = {
  pageKey: "become-a-supplier" | "delivery-geography";
  successMessage: string;
  fields: PageFormField[];
};

export function ConfiguredFormSuccess({ message }: { message: string }) {
  return <p className={styles.success}>{message}</p>;
}

async function uploadAttachment(file: File): Promise<string> {
  const endpoint = publicApiUrl("/v1/request-attachments");
  if (!endpoint) throw new Error("Загрузка файлов пока не настроена.");
  const body = new FormData();
  body.append("file", file);
  // No Content-Type header: the browser must add the multipart boundary itself.
  const response = await fetch(endpoint, { method: "POST", credentials: "include", body });
  const data = (await response.json()) as { ok?: boolean; url?: string; message?: string };
  if (!response.ok || !data.ok || !data.url) throw new Error(data.message ?? "Не удалось загрузить файл");
  return data.url;
}

export function ConfiguredForm({
  form,
  sourceForm,
}: {
  form: PageForm;
  sourceForm: "supplier" | "delivery_quote";
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File | undefined>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (new FormData(event.currentTarget).get(HONEYPOT_FIELD)) return;
    setStatus("loading");
    setError("");
    try {
      const body: Record<string, unknown> = { ...values };
      for (const field of form.fields) {
        const file = files[field.id];
        if (field.type !== "file" || !file) continue;
        const url = await uploadAttachment(file);
        body[field.id] = url;
        body.attachmentUrl = url;
      }
      const result = await submitRequest({ sourceForm, sourcePage: window.location.pathname, body });
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
        {form.fields.map((field) => (
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
            ) : field.type === "file" ? (
              <input
                type="file"
                name={field.id}
                accept=".pdf,.jpg,.jpeg,.png,.webp,.zip"
                required={field.required}
                onChange={(event) => {
                  const chosen = event.target.files?.[0];
                  setFiles((current) => ({ ...current, [field.id]: chosen }));
                }}
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
        {status === "loading" ? "Отправка…" : "Отправить"}
      </button>
    </form>
  );
}
