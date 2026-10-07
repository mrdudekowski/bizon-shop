import type { CatalogView } from "./catalogView";
import styles from "./catalog.module.css";

export function CatalogViewToggle({
  view,
  onChange,
}: {
  view: CatalogView;
  onChange: (view: CatalogView) => void;
}) {
  return (
    <div className={styles.viewToggle} role="group" aria-label="Вид каталога">
      <button type="button" aria-pressed={view === "list"} onClick={() => onChange("list")}>
        Список
      </button>
      <button type="button" aria-pressed={view === "tiles"} onClick={() => onChange("tiles")}>
        Плитки
      </button>
    </div>
  );
}
