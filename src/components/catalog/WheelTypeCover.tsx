import Image from "next/image";
import styles from "./WheelTypeCover.module.css";

export function WheelTypeCover({ imageUrl, name }: { imageUrl?: string | null; name: string }) {
  if (!imageUrl) return null;

  return (
    <figure className={styles.cover}>
      <Image src={imageUrl} alt={name} fill sizes="(max-width: 768px) 100vw, 1200px" priority />
    </figure>
  );
}
