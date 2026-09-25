import { SECTIONS } from "@/constants/sections";

/**
 * Секция преимуществ — светлый premium grid
 */
export const FeaturesSection = () => {
  const features = [
    {
      title: "Надёжность",
      description:
        "Конструкции для экстремальных нагрузок: карьеры, магистрали, бездорожье.",
    },
    {
      title: "Экономичность",
      description:
        "Оптимальный ресурс пробега и снижение простоев автопарка.",
    },
    {
      title: "Сервис",
      description:
        "Подбор, поставки и сопровождение — от консультации до брендирования резины.",
    },
  ];

  return (
    <section id={SECTIONS.FEATURES} className="section section--muted">
      <h2 className="section-title">Почему BIZON</h2>
      <p className="section-description">
        Премиальный industrial-партнёр для fleet-операторов и владельцев тяжёлой
        техники — не каталог, а решение под задачу.
      </p>
      <div className="section-grid">
        {features.map((feature) => (
          <article key={feature.title} className="card-base info-card">
            <h3 className="info-card-title">{feature.title}</h3>
            <p className="info-card-text">{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
