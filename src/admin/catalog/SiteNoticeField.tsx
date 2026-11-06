"use client";

import { useEffect, useState } from "react";

import { actionErrorText } from "@/admin/client/actionFeedback";
import { browserAdminClient } from "@/admin/client/localStore";
import styles from "@/admin/ui/catalog.module.css";

/** One site-profile notice, edited on the catalog that shows it. The public pages keep reading the contact profile. */
export function SiteNoticeField({
  label,
  hint,
  field,
}: {
  label: string;
  hint: string;
  field: "priceNotice" | "madeToOrderNotice";
}) {
  const [value, setValue] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void browserAdminClient().getPage("contact").then((page) => {
      const text = page.draft.id === "contact" ? page.draft.siteProfile?.[field] ?? "" : "";
      setValue(text);
      setSaved(text);
    }).catch(() => {
      setValue("");
      setSaved("");
    });
  }, [field]);

  if (value == null) return null;

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      await browserAdminClient().saveSiteProfileSlice({ [field]: value });
      setSaved(value);
      setMessage("Сохранено");
    } catch (error) {
      setMessage(actionErrorText(error, "Не удалось сохранить"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.notice}>
      <label>
        {label}
        <textarea value={value} onChange={(event) => setValue(event.target.value)} />
      </label>
      <p className={styles.hint}>{hint}</p>
      <button type="button" disabled={saving || value === saved} onClick={() => void save()}>
        {saving ? "Сохраняем…" : "Сохранить"}
      </button>
      {message ? <p role="status">{message}</p> : null}
    </section>
  );
}
