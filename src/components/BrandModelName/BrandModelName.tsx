import styles from "./BrandModelName.module.css";

type BrandModelNameProps = {
  name: string;
};

export function BrandModelName({ name }: BrandModelNameProps) {
  const brandedName = name.match(/^(BIZON)\s+(.+)$/i);

  if (!brandedName) {
    return <span className={styles.root}>{name}</span>;
  }

  return (
    <span className={styles.root}>
      <span className={styles.brand} data-brand>BIZON</span>{" "}
      <span className={styles.model} data-model>{brandedName[2]}</span>
    </span>
  );
}
