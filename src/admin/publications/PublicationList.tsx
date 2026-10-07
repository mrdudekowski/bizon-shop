"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { browserAdminClient } from "@/admin/client/localStore";
import type { ChangeSet, ChangeSetStatus } from "@/admin/domain/types";
import { AdminLoading } from "@/admin/ui/AdminLoading";
import { useAdminSession } from "@/admin/ui/DocumentUI";
import { SectionAccessNotice } from "@/admin/ui/SectionAccessNotice";
import styles from "@/admin/ui/catalog.module.css";

import { ChangeSetReviewDialogs } from "./ChangeSetReviewDialogs";
import {
  CHANGESET_STATUS_LABEL,
  formatExactWhen,
  formatRelativeWhen,
  packTitle,
  shortFieldLine,
} from "./changeSetView";
import pub from "./publications.module.css";

const PERIODS = [
  { id: "all", label: "Любое время" },
  { id: "today", label: "Сегодня" },
  { id: "7d", label: "7 дней" },
  { id: "30d", label: "30 дней" },
] as const;

function inPeriod(iso: string, period: (typeof PERIODS)[number]["id"], now: number): boolean {
  if (period === "all") return true;
  const age = now - new Date(iso).getTime();
  if (period === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return new Date(iso).getTime() >= start.getTime();
  }
  if (period === "7d") return age <= 7 * 86_400_000;
  return age <= 30 * 86_400_000;
}

function chipClass(status: ChangeSetStatus): string {
  if (status === "pending_review") return `${pub.chip} ${pub.chipPending}`;
  if (status === "published") return `${pub.chip} ${pub.chipPublished}`;
  return pub.chip;
}

export function PublicationList() {
  const session = useAdminSession();
  const [packs, setPacks] = useState<ChangeSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ChangeSetStatus | "all">("pending_review");
  const [author, setAuthor] = useState("all");
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  async function reload() {
    try {
      setPacks(await browserAdminClient().listChangeSets());
    } catch {
      setPacks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session?.role === "admin") void reload();
  }, [session?.role]);

  const authors = useMemo(
    () => [...new Set(packs.map((pack) => pack.authorLogin))].sort((a, b) => a.localeCompare(b, "ru")),
    [packs],
  );

  const visible = packs.filter((pack) => {
    const matchesStatus = status === "all" || pack.status === status;
    const matchesAuthor = author === "all" || pack.authorLogin === author;
    const matchesPeriod = inPeriod(pack.updatedAt, period, Date.now());
    const haystack = `${pack.authorLogin} ${pack.entries.map((entry) => entry.entityTitle).join(" ")}`.toLocaleLowerCase("ru-RU");
    const matchesQuery = haystack.includes(query.trim().toLocaleLowerCase("ru-RU"));
    return matchesStatus && matchesAuthor && matchesPeriod && matchesQuery;
  });

  if (session == null) return <main className={pub.screen}><AdminLoading label="Проверяем доступ…" /></main>;
  if (session.role !== "admin") return <SectionAccessNotice title="Публикации" icon="publications" />;

  return (
    <main className={pub.screen}>
      <div>
        <h1>Публикации</h1>
        <p className="subheading">Очередь пакетов правок. Решение — по пакету целиком.</p>
      </div>
      {message ? <p className={pub.status} role="status">{message}</p> : null}
      <div className={styles.filters}>
        <label>
          Поиск
          <input type="search" placeholder="Документ или логин…" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label>
          Статус
          <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
            <option value="pending_review">На одобрении</option>
            <option value="all">Все статусы</option>
            <option value="open">Черновик</option>
            <option value="returned">Вернули</option>
            <option value="published">Опубликовано</option>
            <option value="cancelled">Отменено</option>
          </select>
        </label>
        <label>
          Автор
          <select value={author} onChange={(event) => setAuthor(event.target.value)}>
            <option value="all">Все авторы</option>
            {authors.map((login) => <option key={login} value={login}>{login}</option>)}
          </select>
        </label>
        <label>
          Период
          <select value={period} onChange={(event) => setPeriod(event.target.value as typeof period)}>
            {PERIODS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
      </div>
      {loading ? <AdminLoading label="Загружаем заявки…" /> : visible.length === 0 ? (
        <div className={styles.empty}>
          {status === "pending_review" && query.trim() === "" && author === "all" && period === "all" ? (
            <>
              <h2>Нет заявок на одобрение</h2>
              <p>Когда редактор отправит черновик, он появится здесь.</p>
            </>
          ) : (
            <>
              <h2>Ничего не найдено</h2>
              <p>Измените фильтр или поисковый запрос.</p>
            </>
          )}
        </div>
      ) : (
        <ul className={pub.list}>
          {visible.map((pack) => (
            <li key={pack.id} className={pub.row}>
              <div className={pub.rowHead}>
                <div className={pub.rowBody}>
                  <strong>{packTitle(pack)}</strong>
                  <span className={pub.rowMeta} title={formatExactWhen(pack.updatedAt)}>
                    {pack.authorLogin} · {formatRelativeWhen(pack.updatedAt)}
                  </span>
                </div>
                <span className={chipClass(pack.status)}>{CHANGESET_STATUS_LABEL[pack.status]}</span>
                <div className={pub.rowActions}>
                  <ChangeSetReviewDialogs
                    pack={pack}
                    onUpdated={(_, nextMessage) => {
                      setMessage(nextMessage);
                      void reload();
                    }}
                  />
                  <Link className={pub.openLink} href={`/publications/editor?id=${encodeURIComponent(pack.id)}`}>Открыть пакет</Link>
                </div>
              </div>
              <details>
                <summary>Поля пакета</summary>
                <ul className={pub.fields}>
                  {pack.entries.flatMap((entry) => entry.fieldChanges.map((change) => (
                    <li key={`${entry.id}-${change.path}`}>{shortFieldLine(change)}</li>
                  )))}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
