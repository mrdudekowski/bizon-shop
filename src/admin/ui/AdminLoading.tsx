import styles from "./AdminLoading.module.css";

export function AdminLoading({ label = "Загружаем данные…" }: { label?: string }) {
  return (
    <div className={styles.loading} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
