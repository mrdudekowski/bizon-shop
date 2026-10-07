import styles from "./BurgerToggle.module.css";

const BurgerToggle = ({ isOpen, onToggle, inverted = false }) => (
  <button
    className={`${styles.toggle} ${isOpen ? styles.open : ""} ${inverted ? styles.inverted : ""}`}
    type="button"
    aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
    aria-expanded={isOpen}
    aria-controls="burger-menu"
    onClick={() => onToggle(!isOpen)}
  >
    <span className={styles.icon} aria-hidden="true">
      <span className={`${styles.bar} ${styles.barTop}`} />
      <span className={`${styles.bar} ${styles.barMiddle}`} />
      <span className={`${styles.bar} ${styles.barBottom}`} />
    </span>
    <span className={styles.label}>Все разделы</span>
  </button>
);

export default BurgerToggle;

