import type { LeadRequestRecord } from "@/admin/domain/types";
import styles from "./RequestsList.module.css";

type TelegramStatus = LeadRequestRecord["telegramNotificationStatus"];

type Props = {
  status: TelegramStatus;
  canRetry: boolean;
  busy: boolean;
  onRetry: () => void;
};

const STATUS_LABELS: Record<NonNullable<TelegramStatus>, string> = {
  queued: "В очереди Telegram",
  processing: "Отправляется в Telegram",
  retry_wait: "Ожидает повторной отправки в Telegram",
  accepted_by_telegram: "Отправлено в Telegram",
  failed_final: "Не удалось отправить в Telegram",
};

const RETRY_LABEL = "Повторить отправку в Телеграм";

export function TelegramNotificationStatus({ status, canRetry, busy, onRetry }: Props) {
  const label = status ? STATUS_LABELS[status] : "Статус отправки в Telegram не получен";
  const accepted = status === "accepted_by_telegram";
  const enabled = status === "failed_final" && canRetry && !busy;

  return (
    <div className={styles.telegramControls} aria-label="Уведомление Telegram">
      <span
        className={styles.telegramStatusIcon}
        data-state={accepted ? "accepted" : "pending"}
        data-status={status ?? "unknown"}
        data-tooltip={label}
        title={label}
        role="img"
        aria-label={label}
        tabIndex={0}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M21.6 3.5a1.5 1.5 0 0 0-1.55-.24L2.8 9.9c-1.25.5-1.21 2.27.05 2.72l4.12 1.47 1.53 5.03c.38 1.23 1.94 1.56 2.78.59l2.35-2.7 4.58 3.36c.95.7 2.3.18 2.52-.98l2.08-14.3a1.5 1.5 0 0 0-1.21-1.6ZM9.2 13.45l8.4-6.05-6.8 7.4-.29 3.05-1.31-4.4Z" fill="currentColor" />
        </svg>
      </span>
      <button
        className={styles.telegramRetryButton}
        type="button"
        aria-label={RETRY_LABEL}
        aria-busy={busy}
        title={busy ? "Ставим в очередь…" : RETRY_LABEL}
        disabled={!enabled}
        onClick={onRetry}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M20.5 7.5V3.8l-1.3 1.3A8.5 8.5 0 0 0 4.2 8.5M3.5 16.5v3.7l1.3-1.3A8.5 8.5 0 0 0 19.8 15.5M20.5 3.8v5h-5M3.5 20.2v-5h5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
