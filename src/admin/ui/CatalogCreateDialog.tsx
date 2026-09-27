"use client";

import type { FormEvent, ReactNode, Ref } from "react";
import styles from "./catalog.module.css";

export function CatalogCreateDialog({
  dialogRef,
  title,
  nameLabel,
  name,
  slug,
  namePlaceholder,
  context,
  extraField,
  submitLabel = "Создать",
  onNameChange,
  onSlugChange,
  onCancel,
  onSubmit,
}: {
  dialogRef: Ref<HTMLDialogElement>;
  title: string;
  nameLabel: string;
  name: string;
  slug: string;
  namePlaceholder?: string;
  context?: ReactNode;
  extraField?: ReactNode;
  submitLabel?: string;
  onNameChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <dialog ref={dialogRef} className={styles.dialog}>
      <form onSubmit={onSubmit}>
        <h2>{title}</h2>
        <label>
          {nameLabel}
          <input autoFocus required value={name} placeholder={namePlaceholder} onChange={(event) => onNameChange(event.target.value)} />
        </label>
        <label>
          Адрес
          <input required value={slug} onChange={(event) => onSlugChange(event.target.value)} />
          <span className={styles.hint}>Формируется из названия. После публикации адрес нельзя изменить.</span>
        </label>
        {extraField}
        {context ? <p className={styles.hint}>{context}</p> : null}
        <div className={styles.dialogActions}>
          <button type="button" className="ghost" onClick={onCancel}>Отмена</button>
          <button className="primary" type="submit" disabled={!name.trim() || !slug.trim()}>{submitLabel}</button>
        </div>
      </form>
    </dialog>
  );
}
