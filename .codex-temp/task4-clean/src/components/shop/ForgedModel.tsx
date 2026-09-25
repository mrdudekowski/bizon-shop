import Image from "next/image";
import Link from "next/link";
import { ForgedConfigurator } from "./ForgedConfigurator";
import { metaLine, type ForgedWheelView } from "./forgedView";
import styles from "./ForgedModel.module.css";

const BASE_PATH = "/shop/wheels/forged";

export function ForgedModel({ model }: { model: ForgedWheelView }) {
  return (
    <div className={styles.page}>
      <section className={styles.hero} data-shop-chrome-tone="dark">
        <div className={styles.heroMedia}>
          <Image
            src={model.heroImage}
            alt={model.name}
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className={styles.heroShade} />
        <div className={styles.heroInner}>
          <nav aria-label="Хлебные крошки" className={styles.breadcrumbs}>
            <Link href="/shop">Shop</Link>
            <span aria-hidden="true">/</span>
            <Link href={BASE_PATH}>BIZON Forged</Link>
          </nav>
          <p className={styles.status}>Изготавливается под заказ</p>
          <h1>{model.name}</h1>
          <p className={styles.meta}>{metaLine(model)}</p>
          <Link href="#wheel-request" className={styles.primaryAction}>Подобрать конфигурацию</Link>
        </div>
      </section>

      <section className={styles.intro} data-shop-chrome-tone="light">
        <div className={styles.introInner}>
          <p className={styles.kicker}>Характер дизайна</p>
          <div className={styles.introGrid}>
            <h2>{model.description}</h2>
            <p>
              Финальная конфигурация зависит от автомобиля. Специалист BIZON проверит
              посадочные параметры, допустимую нагрузку и возможность выбранного покрытия.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.gallery} data-shop-chrome-tone="dark" aria-label={`Виды ${model.name}`}>
        {model.gallery.map((image, index) => (
          <figure className={index === 0 ? styles.galleryFeature : styles.galleryCard} key={image.src}>
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes={index === 0 ? "(max-width: 760px) 100vw, 66vw" : "(max-width: 760px) 100vw, 34vw"}
            />
            <figcaption>{image.label}</figcaption>
          </figure>
        ))}
      </section>

      <section className={styles.selection} data-shop-chrome-tone="light">
        <div className={styles.selectionInner}>
          <div className={styles.selectionHead}>
            <p className={styles.kicker}>Перед изготовлением</p>
            <h2>Подтвердим совместимость</h2>
          </div>
          <div className={styles.facts}>
            <article>
              <span>01</span>
              <h3>Автомобиль</h3>
              <p>Марка, модель, год и текущая конфигурация колёс.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Параметры</h3>
              <p>Размер, разболтовка, вылет и центральное отверстие.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Исполнение</h3>
              <p>Цвет, покрытие и детали индивидуального заказа.</p>
            </article>
          </div>
          <ForgedConfigurator model={model} />
          <div className={styles.actions}>
            <Link href={BASE_PATH} className={styles.secondaryAction}>← Все дизайны</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
