import Image from "next/image";

import { hasCatalogImage, resolveCatalogImageSrc } from "@/constants/images";

type CatalogImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  fallbackKey?: string;
};

export function CatalogImage({
  src,
  alt,
  className,
  fill = false,
  sizes,
  priority = false,
}: CatalogImageProps) {
  const resolved = resolveCatalogImageSrc(src);
  const isPlaceholder = !hasCatalogImage(src);
  const classes = ["catalog-image", isPlaceholder && "catalog-image--placeholder", className]
    .filter(Boolean)
    .join(" ");

  if (fill) {
    return (
      <Image
        src={resolved}
        alt={alt}
        fill
        className={classes}
        sizes={sizes ?? "100vw"}
        priority={priority}
      />
    );
  }

  return (
    <Image
      src={resolved}
      alt={alt}
      width={640}
      height={400}
      className={classes}
      sizes={sizes ?? "(max-width: 768px) 100vw, 33vw"}
      priority={priority}
    />
  );
}
