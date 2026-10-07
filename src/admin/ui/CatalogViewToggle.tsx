import type { CatalogView } from "./catalogView";
import styles from "./catalog.module.css";

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="4" cy="6" r="1.5" />
      <rect x="8" y="5" width="13" height="2" rx="1" />
      <circle cx="4" cy="12" r="1.5" />
      <rect x="8" y="11" width="13" height="2" rx="1" />
      <circle cx="4" cy="18" r="1.5" />
      <rect x="8" y="17" width="13" height="2" rx="1" />
    </svg>
  );
}

function TilesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
    </svg>
  );
}

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
        <ListIcon /> Список
      </button>
      <button type="button" aria-pressed={view === "tiles"} onClick={() => onChange("tiles")}>
        <TilesIcon /> Плитки
      </button>
    </div>
  );
}
