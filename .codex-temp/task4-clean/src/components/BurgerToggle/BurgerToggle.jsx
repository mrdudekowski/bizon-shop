import styles from "./BurgerToggle.module.css";

const BurgerToggle = ({ isOpen, onToggle }) => {
  const handleChange = () => {
    onToggle(!isOpen);
  };

  return (
    <div className={styles.wrapper}>
      <input
        id="burger-toggle"
        type="checkbox"
        className={styles.checkbox}
        checked={isOpen}
        onChange={handleChange}
      />
      <label
        className={styles.toggle}
        htmlFor="burger-toggle"
        aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
      >
        <div className={`${styles.bar} ${styles.barTop}`} />
        <div className={`${styles.bar} ${styles.barMiddle}`} />
        <div className={`${styles.bar} ${styles.barBottom}`} />
      </label>
    </div>
  );
};

export default BurgerToggle;

