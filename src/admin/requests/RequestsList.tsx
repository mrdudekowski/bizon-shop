"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { browserAdminClient } from "@/admin/client/localStore";
import type { LeadRequestRecord, LeadRequestStatus } from "@/admin/domain/types";
import { AdminLoading } from "@/admin/ui/AdminLoading";
import styles from "./RequestsList.module.css";

const STATUS_OPTIONS: readonly { value: LeadRequestStatus; label: string }[] = [
  { value: "new", label: "Новая" },
  { value: "in_progress", label: "В работе" },
  { value: "contacted", label: "Связались" },
  { value: "qualified", label: "Квалифицирована" },
  { value: "won", label: "Успешно закрыта" },
  { value: "lost", label: "Отказ" },
  { value: "closed", label: "Закрыта" },
  { value: "archived", label: "В архиве" },
  { value: "spam", label: "Спам" },
];

const SOURCE_LABELS: Record<string, string> = {
  tire_cart: "Корзина шин BIZON",
  shop_cart: "Корзина BIZON Shop",
  cart: "Корзина",
  contact: "Форма контактов",
  branding: "Брендирование",
  supplier: "Стать поставщиком",
  warranty: "Гарантия",
  tire_selection: "Подбор шин",
  wheel_selection: "Подбор дисков",
  selection: "Подбор шин / дисков",
  procurement: "Запрос по спецификации",
  product_quick_order: "Быстрый заказ товара",
  hero_cta: "Первый экран (Hero)",
  footer_cta: "Подвал сайта",
  custom: "Другое",
};

const SOURCE_FILTER_OPTIONS: readonly { value: string; label: string }[] = [
  { value: "tire_cart", label: "Корзина шин BIZON" },
  { value: "shop_cart", label: "Корзина BIZON Shop" },
  { value: "contact", label: "Форма контактов" },
  { value: "branding", label: "Брендирование" },
  { value: "wheel_selection", label: "Подбор дисков" },
  { value: "tire_selection", label: "Подбор шин" },
  { value: "procurement", label: "Запрос по спецификации" },
  { value: "supplier", label: "Стать поставщиком" },
  { value: "warranty", label: "Гарантия" },
];

function formatSource(sourceForm: string): string {
  return SOURCE_LABELS[sourceForm] ?? SOURCE_LABELS[sourceForm.replace(/-/g, "_")] ?? "Обращение с сайта";
}

export function RequestsList() {
  const [requests, setRequests] = useState<LeadRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("");

  const reload = useCallback(async () => {
    const data = await browserAdminClient().listRequests();
    setRequests(data);
  }, []);

  useEffect(() => {
    void reload()
      .catch(() => setError("Не удалось загрузить список заявок."))
      .finally(() => setLoading(false));
  }, [reload]);

  async function onStatusChange(id: string, nextStatus: LeadRequestStatus) {
    setBusyId(id);
    setError("");
    try {
      const updated = await browserAdminClient().updateRequestStatus(id, nextStatus);
      setRequests((current) => current.map((item) => (item.id === id ? updated : item)));
    } catch {
      setError("Не удалось обновить статус заявки.");
    } finally {
      setBusyId(null);
    }
  }

  const visibleRequests = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ru-RU");
    return requests.filter((req) => {
      if (statusFilter && req.status !== statusFilter) return false;
      if (sourceFilter && req.sourceForm !== sourceFilter) return false;
      if (!query) return true;
      const haystack = [
        req.id,
        req.name,
        req.phone,
        req.email,
        req.companyName,
        req.inn,
        req.city,
        req.message,
        ...req.items.map((item) => `${item.name} ${item.variantLabel ?? ""} ${item.notes ?? ""}`),
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("ru-RU");
      return haystack.includes(query);
    });
  }, [requests, search, statusFilter, sourceFilter]);

  const counts = useMemo(() => {
    const newCount = requests.filter((r) => r.status === "new").length;
    const inProgressCount = requests.filter((r) => r.status === "in_progress" || r.status === "contacted" || r.status === "qualified").length;
    return { total: requests.length, newCount, inProgressCount };
  }, [requests]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Заявки</h1>
          <p>Обращения клиентов, заявки из корзины шин и заказы BIZON Shop.</p>
        </div>
        <div className={styles.counters}>
          <span className={styles.counter}>Всего: {counts.total}</span>
          <span className={styles.counter}>Новые: {counts.newCount}</span>
          <span className={styles.counter}>В работе: {counts.inProgressCount}</span>
        </div>
      </header>

      {error ? <p role="alert">{error}</p> : null}

      <div className={styles.filters} aria-label="Фильтры заявок">
        <label>
          Поиск по клиенту или товару
          <input
            type="search"
            placeholder="Имя, телефон, компания, ИНН, модель…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label>
          Статус заявки
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">Все статусы</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Источник
          <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
            <option value="">Все источники</option>
            {SOURCE_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <AdminLoading label="Загружаем заявки…" />
      ) : visibleRequests.length === 0 ? (
        <p className={styles.empty}>
          {requests.length === 0
            ? "Поступивших заявок пока нет. Все отправленные с сайта формы и корзины автоматически появятся здесь."
            : "По выбранным фильтрам заявки не найдены."}
        </p>
      ) : (
        <ul className={styles.list}>
          {visibleRequests.map((req) => (
            <li key={req.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.clientHead}>
                  <h2>
                    #{req.id} · {req.name || "Без имени"}
                  </h2>
                  <div className={styles.meta}>
                    <span className={styles.sourceBadge}>{formatSource(req.sourceForm)}</span>
                    <time dateTime={req.createdAt}>
                      {req.createdAt ? new Date(req.createdAt).toLocaleString("ru-RU") : ""}
                    </time>
                    {req.sourcePage ? <span>Страница: {req.sourcePage}</span> : null}
                  </div>
                </div>
                <label className={styles.statusControl}>
                  <span className="visuallyHidden">Статус заявки #{req.id}</span>
                  <select
                    aria-label={`Статус заявки #${req.id}`}
                    value={req.status}
                    disabled={busyId === req.id}
                    onChange={(event) => void onStatusChange(req.id, event.target.value as LeadRequestStatus)}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <dl className={styles.contactsGrid}>
                <div>
                  <dt>Телефон</dt>
                  <dd>
                    <a href={`tel:${req.phone}`}>{req.phone}</a>
                  </dd>
                </div>
                {req.email ? (
                  <div>
                    <dt>Email</dt>
                    <dd>
                      <a href={`mailto:${req.email}`}>{req.email}</a>
                    </dd>
                  </div>
                ) : null}
                {req.companyName ? (
                  <div>
                    <dt>Компания</dt>
                    <dd>{req.companyName}</dd>
                  </div>
                ) : null}
                {req.inn ? (
                  <div>
                    <dt>ИНН</dt>
                    <dd>{req.inn}</dd>
                  </div>
                ) : null}
                {req.city ? (
                  <div>
                    <dt>Город</dt>
                    <dd>{req.city}</dd>
                  </div>
                ) : null}
                {req.purchaseVolume ? (
                  <div>
                    <dt>Объём закупки</dt>
                    <dd>{req.purchaseVolume}</dd>
                  </div>
                ) : null}
              </dl>

              {req.message ? <div className={styles.messageBox}>{req.message}</div> : null}

              {req.items.length > 0 ? (
                <div className={styles.itemsSection}>
                  <h3>Позиции в заявке ({req.items.length})</h3>
                  <div className={styles.itemsList}>
                    {req.items.map((item) => (
                      <div key={item.id} className={styles.itemRow}>
                        <strong>
                          {item.name}
                          {item.variantLabel ? ` · ${item.variantLabel}` : ""}
                        </strong>
                        <span>
                          {item.quantity} шт. ·{" "}
                          {item.priceOnRequest || item.price == null
                            ? "Цена по запросу"
                            : `${item.price.toLocaleString("ru-RU")} ₽`}
                        </span>
                        {item.notes ? <div className={styles.itemNotes}>{item.notes}</div> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
