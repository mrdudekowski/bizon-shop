"use client";

import { useId, useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";

import type { DocumentStatus } from "@/admin/domain/types";
import { resolveMediaPreviewUrl } from "@/admin/domain/catalogPreviewUrl";
import { AdminClientError } from "@/admin/client/errors";
import { Icon, type IconName } from "./Icon";
import { StatusControl } from "./StatusControl";
import type { CatalogView } from "./catalogView";
import styles from "./catalog.module.css";

const STATUS_LABEL: Record<DocumentStatus, string> = {
  draft: "черновик",
  on_site: "на сайте",
  hidden: "скрыто",
};

export function CatalogRow({
  href,
  title,
  meta,
  icon,
  imageUrl,
  tileImageUrl,
  imageOnWhiteBackground = false,
  largeShopCategory = false,
  view = "list",
  status,
  hasUnpublishedDraft = false,
  onDelete,
  onStatusChange,
}: {
  href: string;
  title: string;
  meta?: string;
  icon: IconName;
  imageUrl?: string | null;
  tileImageUrl?: string | null;
  imageOnWhiteBackground?: boolean;
  largeShopCategory?: boolean;
  view?: CatalogView;
  status?: DocumentStatus;
  hasUnpublishedDraft?: boolean;
  onDelete?: () => Promise<void>;
  onStatusChange?: (status: DocumentStatus) => Promise<void>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const titleId = useId();
  const resolvedImageUrl = resolveMediaPreviewUrl(imageUrl);
  const resolvedTileImageUrl = resolveMediaPreviewUrl(tileImageUrl ?? imageUrl);

  function openDelete(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDeleteError("");
    dialogRef.current?.showModal();
  }

  async function confirmDelete() {
    if (!onDelete || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await onDelete();
      dialogRef.current?.close();
    } catch (error) {
      setDeleteError(
        error instanceof AdminClientError && error.code === "publish_blocked"
          ? "Удаление заблокировано: сначала скройте опубликованную запись или удалите связанные элементы."
          : "Не удалось завершить удаление. Повторите попытку; если ошибка останется, проверьте подключение и права доступа.",
      );
    } finally {
      setDeleting(false);
    }
  }

  const rowContent = (
    <>
      <span className={`${styles.rowThumb} ${imageOnWhiteBackground ? styles.rowThumbWhiteImage : ""} ${largeShopCategory ? styles.rowThumbLarge : ""}`}>
        {resolvedImageUrl ? <Image unoptimized width={48} height={48} src={resolvedImageUrl} alt="" /> : <Icon name={icon} size={24} />}
      </span>
      <span className={styles.rowBody}>
        <strong>{title}</strong>
        {meta ? <span className={styles.rowMeta}>{meta}</span> : null}
      </span>
    </>
  );

  const tileVisual = (
    <>
      <span className={styles.tileMedia} aria-hidden="true">
        {resolvedTileImageUrl ? <Image unoptimized width={480} height={480} className={styles.tileImage} src={resolvedTileImageUrl} alt="" /> : <Icon className={styles.tileIcon} name={icon} size={42} />}
      </span>
      <span className={styles.tileOverlay} />
      <span className={styles.tileBody}>
        <strong>{title}</strong>
        {meta ? <span className={styles.tileMeta}>{meta}</span> : null}
      </span>
      <Icon className={styles.tileArrow} name="arrow" size={18} />
    </>
  );

  const tileBadges = (
    <span className={styles.tileBadges}>
      {status ? onStatusChange ? <StatusControl status={status} title={title} onChange={onStatusChange} /> : <span className={status === "on_site" ? styles.badgeOnSite : styles.badge}>{STATUS_LABEL[status]}</span> : null}
      {hasUnpublishedDraft ? <span className={styles.badge}>есть черновик</span> : null}
    </span>
  );

  const deleteDialog = (
    <dialog ref={dialogRef} className={styles.confirmDialog} aria-labelledby={titleId}>
      <div className={styles.confirmBody}>
        <h2 id={titleId}>Удалить «{title}»?</h2>
        <p>Карточка будет удалена. Если она опубликована, она исчезнет с сайта. URL освободится для повторного использования.</p>
        <p className={styles.deleteWarning}>Отменить удаление после подтверждения нельзя.</p>
        {deleteError ? <p className={styles.deleteError} role="alert">{deleteError}</p> : null}
        <div className={styles.dialogActions}>
          <button type="button" className="ghost" disabled={deleting} onClick={() => dialogRef.current?.close()} autoFocus>
            Отмена
          </button>
          <button type="button" className={styles.confirmDelete} disabled={deleting} onClick={() => void confirmDelete()}>
            {deleting ? "Удаляем…" : "Удалить"}
          </button>
        </div>
      </div>
    </dialog>
  );

  if (view === "tiles") {
    if (!onDelete && !onStatusChange) {
      return (
        <Link className={styles.catalogTile} href={href}>
          {tileVisual}
          {status || hasUnpublishedDraft ? tileBadges : null}
        </Link>
      );
    }

    return (
      <>
        <article className={styles.catalogTile}>
          <Link className={styles.tileLink} href={href} aria-label={`Открыть: ${title}`}>
            {tileVisual}
          </Link>
          <div className={styles.tileActions}>
            {status || hasUnpublishedDraft ? tileBadges : <span />}
            {onDelete ? <button type="button" className={styles.rowDelete} aria-label={`Удалить: ${title}`} title="Удалить" onClick={openDelete}><Icon name="trash" size={17} /></button> : null}
          </div>
        </article>
        {deleteDialog}
      </>
    );
  }

  if (!onDelete && !onStatusChange) {
    return (
      <Link className={`${styles.catalogRow} ${largeShopCategory ? styles.catalogRowLarge : ""}`} href={href}>
        {rowContent}
        <span className={styles.rowBadges}>
          {status ? onStatusChange ? <StatusControl status={status} title={title} onChange={onStatusChange} /> : <span className={status === "on_site" ? styles.badgeOnSite : styles.badge}>{STATUS_LABEL[status]}</span> : null}
          {hasUnpublishedDraft ? <span className={styles.badge}>есть черновик</span> : null}
        </span>
        <Icon className={styles.rowArrow} name="arrow" size={18} />
      </Link>
    );
  }

  return (
    <div className={`${styles.catalogRow} ${styles.catalogRowActionable} ${largeShopCategory ? styles.catalogRowLarge : ""}`}>
      <Link className={styles.rowMainLink} href={href} aria-label={`Открыть: ${title}`}>
        {rowContent}
      </Link>
      <div className={styles.rowActions}>
        {onDelete ? <button
          type="button"
          className={styles.rowDelete}
          aria-label={`Удалить: ${title}`}
          title="Удалить"
          onClick={openDelete}
        >
          <Icon name="trash" size={17} />
        </button> : null}
        <span className={styles.rowBadges}>
          {status ? onStatusChange ? <StatusControl status={status} title={title} onChange={onStatusChange} /> : <span className={status === "on_site" ? styles.badgeOnSite : styles.badge}>{STATUS_LABEL[status]}</span> : null}
          {hasUnpublishedDraft ? <span className={styles.badge}>есть черновик</span> : null}
        </span>
        <Link className={styles.rowOpenLink} href={href} aria-label={`Открыть: ${title}`}>
          <Icon className={styles.rowArrow} name="arrow" size={18} />
        </Link>
      </div>
      {deleteDialog}
    </div>
  );
}
