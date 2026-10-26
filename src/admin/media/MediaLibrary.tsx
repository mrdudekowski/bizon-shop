"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { browserAdminClient } from "@/admin/client/localStore";
import { AdminClientError } from "@/admin/client/errors";
import type { MediaDeletionHistoryItem, MediaListItem } from "@/admin/domain/types";
import { resolveMediaPreviewUrl } from "@/admin/domain/catalogPreviewUrl";
import type { MediaUsageState } from "@/admin/domain/types";
import { useAdminSession } from "@/admin/ui/DocumentUI";
import { AdminLoading } from "@/admin/ui/AdminLoading";
import { SectionAccessNotice } from "@/admin/ui/SectionAccessNotice";
import styles from "./MediaLibrary.module.css";
import { filterAssetsByUsage, getMediaUsageOptions, type MediaUsageFilter } from "./mediaUsageFilters";

function mediaActionError(error: unknown): string {
  if (error instanceof AdminClientError && error.code === "storage_unavailable") return "Хранилище файлов недоступно. Попробуйте позже.";
  if (error instanceof AdminClientError && error.code === "media_storage_key_missing") return "Для этого старого файла пока нельзя выполнить безопасное удаление.";
  return "Не удалось выполнить действие. Обновите страницу и попробуйте ещё раз.";
}

export type MediaTypeFilter = "all" | "image" | "pdf";
export type MediaSortOrder = "default" | "newest" | "oldest" | "name";

export function MediaLibrary() {
  const session = useAdminSession();
  const [assets, setAssets] = useState<MediaListItem[]>([]);
  const [history, setHistory] = useState<MediaDeletionHistoryItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [usageFilter, setUsageFilter] = useState<MediaUsageFilter>({});
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<MediaTypeFilter>("all");
  const [sortOrder, setSortOrder] = useState<MediaSortOrder>("default");

  const reload = useCallback(async () => {
    const client = browserAdminClient();
    const [nextAssets, nextHistory] = await Promise.all([client.listAssets(), client.listMediaDeletionHistory()]);
    setAssets(nextAssets);
    setHistory(nextHistory);
  }, []);

  const usageOptions = useMemo(() => getMediaUsageOptions(assets, usageFilter), [assets, usageFilter]);
  const visibleAssets = useMemo(() => {
    const byUsage = filterAssetsByUsage(assets, usageFilter);
    const query = search.trim().toLocaleLowerCase("ru-RU");
    const filtered = byUsage.filter((asset) => {
      if (query && !asset.name.toLocaleLowerCase("ru-RU").includes(query)) return false;
      if (typeFilter === "image" && !asset.mimeType.startsWith("image/")) return false;
      if (typeFilter === "pdf" && asset.mimeType !== "application/pdf") return false;
      return true;
    });
    if (sortOrder === "default") return filtered;
    return [...filtered].sort((a, b) => {
      if (sortOrder === "name") return a.name.localeCompare(b.name, "ru");
      const timeA = a.createdAt ? Date.parse(a.createdAt) : Number(a.id) || 0;
      const timeB = b.createdAt ? Date.parse(b.createdAt) : Number(b.id) || 0;
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });
  }, [assets, usageFilter, search, typeFilter, sortOrder]);

  useEffect(() => {
    void reload().catch((cause) => setError(mediaActionError(cause))).finally(() => setLoading(false));
  }, [reload]);

  if (!session) return <main><AdminLoading label="Проверяем доступ…" /></main>;
  if (session.role !== "admin") return <SectionAccessNotice title="Файлы" icon="image" />;

  async function remove(asset: MediaListItem) {
    const usageLines = asset.usages?.length
      ? asset.usages.map((usage) => `${usage.topLevelLabel} → ${usage.pageLabel} → ${usage.placementLabel} (${usage.state === "published-visible" ? "Показывается" : usage.state === "draft-unpublished" ? "Черновик" : "Скрыто"})`)
      : asset.usedBy;
    const usageCount = usageLines.length;
    const usageWarning = usageCount > 0
      ? `Файл связан с ${usageCount} ${usageCount === 1 ? "размещением" : "размещениями"}:\n${usageLines.map((place) => `• ${place}`).join("\n")}\nВсе перечисленные связи и сам файл будут удалены.`
      : "";
    const replacementWarning = asset.replacementPending ? "\nБудет также отменена и удалена ожидающая замена файла." : "";
    if (!window.confirm(`Удалить файл «${asset.name}» из хранилища?${usageWarning ? `\n\n${usageWarning}` : ""}${replacementWarning}\nЭто действие нельзя отменить.`)) return;
    setError("");
    setBusyId(asset.id);
    try {
      await browserAdminClient().deleteAsset(asset.id);
      await reload();
    } catch (cause) {
      setError(mediaActionError(cause));
      if (cause instanceof AdminClientError && cause.code === "media_in_use") await reload();
    } finally {
      setBusyId(null);
    }
  }

  async function detach(asset: MediaListItem, usageId: string, placementLabel: string) {
    if (!window.confirm(`Отвязать файл «${asset.name}» от места «${placementLabel}»? Сам файл и остальные связи останутся.`)) return;
    setError("");
    setBusyId(asset.id);
    try {
      await browserAdminClient().detachAssetUsage(asset.id, usageId);
      await reload();
    } catch (cause) {
      setError(mediaActionError(cause));
      await reload().catch(() => undefined);
    } finally {
      setBusyId(null);
    }
  }

  function updateFilter(next: Partial<MediaUsageFilter>) {
    setUsageFilter((current) => ({ ...current, ...next }));
  }

  return <main className={styles.page}>
    <header className={styles.header}><div><h1>Файлы</h1><p>Загруженные изображения и места, где они используются.</p></div><span>{assets.length} файлов</span></header>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    <div className={styles.filters} aria-label="Фильтры файлов">
      <label className={styles.searchField}>Поиск по названию<input type="search" placeholder="Например, hero или atlas" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      <label>Тип файла<select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as MediaTypeFilter)}>
        <option value="all">Все типы</option>
        <option value="image">Изображения</option>
        <option value="pdf">PDF-документы</option>
      </select></label>
      <label>Сортировка по дате<select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as MediaSortOrder)}>
        <option value="default">По умолчанию</option>
        <option value="newest">Сначала новые</option>
        <option value="oldest">Сначала старые</option>
        <option value="name">По названию (А–Я)</option>
      </select></label>
      <label>Статус<select value={usageFilter.state ?? ""} onChange={(event) => updateFilter({ state: (event.target.value || undefined) as MediaUsageState | "unused" | undefined, topLevelKey: undefined, pageKey: undefined, placementKey: undefined })}>
        <option value="">Любой статус</option><option value="published-visible">Показывается</option><option value="draft-unpublished">Черновик</option><option value="hidden-not-rendered">Скрыто</option><option value="unused">Не используется</option>
      </select></label>
      <label>Страница / раздел<select value={usageFilter.topLevelKey ?? ""} onChange={(event) => updateFilter({ topLevelKey: event.target.value || undefined, pageKey: undefined, placementKey: undefined })}>
        <option value="">Все страницы</option>{usageOptions.topLevels.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
      </select></label>
      <label>Вложенная страница<select value={usageFilter.pageKey ?? ""} disabled={!usageFilter.topLevelKey || usageFilter.state === "unused"} onChange={(event) => updateFilter({ pageKey: event.target.value || undefined, placementKey: undefined })}>
        <option value="">Все вложенные страницы</option>{usageOptions.pages.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
      </select></label>
      <label>Раздел / место<select value={usageFilter.placementKey ?? ""} disabled={!usageFilter.pageKey || usageFilter.state === "unused"} onChange={(event) => updateFilter({ placementKey: event.target.value || undefined })}>
        <option value="">Все места</option>{usageOptions.placements.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
      </select></label>
    </div>
    {loading ? <AdminLoading label="Загружаем файлы…" /> : assets.length === 0 ? <p className={styles.empty}>Загруженных файлов пока нет.</p> : visibleAssets.length === 0 ? <p className={styles.empty}>Файлы по выбранным фильтрам не найдены.</p> : <ul className={styles.list}>
      {visibleAssets.map((asset) => <li className={styles.asset} key={asset.id}>
        <img className={styles.preview} src={resolveMediaPreviewUrl(asset.dataUrl) ?? undefined} alt="" />
        <div className={styles.details}><strong>{asset.name}</strong><span>{asset.mimeType || "Тип не указан"}{asset.createdAt ? ` · ${new Date(asset.createdAt).toLocaleDateString("ru-RU")}` : ""}</span>
          {asset.usages?.length || asset.usedBy.length ? <span className={styles.usageStatus}><i aria-label="Файл используется" title="Файл используется" />Файл используется{asset.usages?.length ? ` · ${asset.usages.length} ${asset.usages.length === 1 ? "размещение" : "размещений"}` : ""}</span> : null}
          {asset.replacementPending ? <span className={styles.unused}>Новая версия покажется на сайте после публикации.</span> : null}
          {asset.usages?.length ? <div className={styles.usage}><b>Размещения:</b><ul>{asset.usages.map((usage) => <li key={usage.id}>
            <span>{usage.topLevelLabel} → {usage.pageLabel} → {usage.placementLabel} · {usage.state === "published-visible" ? "Показывается" : usage.state === "draft-unpublished" ? "Черновик" : "Скрыто"}</span>
            {usage.reviewRecommended && usage.diagnosticReason ? <span className={styles.diagnostic}>Проверьте связь: {usage.diagnosticReason}</span> : null}
            {usage.detachable ? <button type="button" className="ghost" disabled={busyId === asset.id} onClick={() => void detach(asset, usage.id, usage.placementLabel)}>{busyId === asset.id ? "Сохраняем…" : "Отвязать"}</button> : null}
          </li>)}</ul></div> : asset.usedBy.length > 0 ? <div className={styles.usage}><b>Места использования:</b><ul>{asset.usedBy.map((place, index) => <li key={`${place}-${index}`}>{place}</li>)}</ul></div> : asset.usages ? <span className={styles.unused}>Нигде не используется</span> : <span className={styles.legacy}>Данные о размещениях ещё не загружены.</span>}
        </div>
        <button className="ghost" type="button" disabled={busyId === asset.id} onClick={() => void remove(asset)}>
          {busyId === asset.id ? "Удаляем…" : "Удалить"}
        </button>
      </li>)}
    </ul>}
    <section className={styles.history} aria-labelledby="media-history-title">
      <div><h2 id="media-history-title">История удалений</h2><p>Видна только администраторам. Хранятся последние 200 записей.</p></div>
      {history.length === 0 ? <p>Записей пока нет.</p> : <ul>{history.map((item) => <li key={item.id}><strong>{item.filename} · ID файла {item.mediaId}</strong><span>{item.deletedBy}</span><time dateTime={item.deletedAt}>{new Date(item.deletedAt).toLocaleString("ru-RU")}</time></li>)}</ul>}
    </section>
  </main>;
}
