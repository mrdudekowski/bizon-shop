import Image from "next/image";
import type { CmsWheelType } from "@/lib/content/types";
import { responsiveFocalStyle } from "@/lib/content/responsiveFocalPosition";
import styles from "./WheelTypeCover.module.css";

export function WheelTypeCover({ imageUrl, name, imageFocalX, imageFocalY, imageFocalByViewport }: Pick<CmsWheelType, "imageUrl" | "name" | "imageFocalX" | "imageFocalY" | "imageFocalByViewport">) {
  if (!imageUrl) return null;

  return (
    <figure className={styles.cover}>
      <Image src={imageUrl} alt={name} fill sizes="(max-width: 768px) 100vw, 1200px" priority className="responsiveFocalImage" style={responsiveFocalStyle(imageFocalByViewport, imageFocalX, imageFocalY)} />
    </figure>
  );
}
