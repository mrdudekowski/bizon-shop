import styles from "./AvailabilityToggle.module.css";

type AvailabilityToggleProps = {
  available: boolean;
  onChange: (available: boolean) => void;
};

export function AvailabilityToggle({ available, onChange }: AvailabilityToggleProps) {
  return (
    <div className={styles.field}>
      <span className={styles.label}>Статус наличия модели</span>
      <div className={styles.options} role="group" aria-label="Статус наличия модели">
        <button
          type="button"
          className={styles.option}
          aria-pressed={available}
          onClick={() => onChange(true)}
        >
          В наличии
        </button>
        <button
          type="button"
          className={styles.option}
          aria-pressed={!available}
          onClick={() => onChange(false)}
        >
          Под заказ
        </button>
      </div>
    </div>
  );
}
