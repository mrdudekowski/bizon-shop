import Link from "next/link";

import styles from "./TireIqApplicationGuide.module.css";

const GUIDE_GROUPS = [
  {
    title: "Техника",
    options: [
      { label: "Магистральная техника", href: "/tire-iq#knowledge" },
      { label: "Строительная техника", href: "/tire-iq#knowledge" },
      { label: "Карьерная техника", href: "/tire-iq#knowledge" },
    ],
  },
  {
    title: "Режим эксплуатации",
    options: [
      { label: "Дальние перевозки", href: "/tire-iq#knowledge" },
      { label: "Смешанный маршрут", href: "/tire-iq#knowledge" },
      { label: "Тяжёлые условия", href: "/contact" },
    ],
  },
  {
    title: "Ось",
    options: [
      { label: "Рулевая", href: "/tire-iq#knowledge" },
      { label: "Ведущая", href: "/tire-iq#knowledge" },
      { label: "Прицепная", href: "/tire-iq#knowledge" },
    ],
  },
  {
    title: "Приоритет",
    options: [
      { label: "Подбор решения", href: "/selection" },
      { label: "Контроль износа", href: "/tire-iq#knowledge" },
      { label: "Проверка задачи", href: "/contact" },
    ],
  },
] as const;

export function TireIqApplicationGuide({ hasKnowledge = true }: { hasKnowledge?: boolean }) {
  return (
    <section className={styles.section} aria-labelledby="application-guide-heading">
      <div className={styles.heading}>
        <p className={styles.kicker}>Первый шаг</p>
        <h2 id="application-guide-heading">С чего начать подбор</h2>
        <p>
          Сузьте задачу по контексту эксплуатации. Это образовательная навигация,
          а не автоматическая рекомендация конкретной модели.
        </p>
      </div>
      <div className={styles.groups}>
        {GUIDE_GROUPS.map((group, index) => (
          <div className={styles.group} key={group.title}>
            <div className={styles.groupHeader}>
              <span aria-hidden="true">0{index + 1}</span>
              <h3>{group.title}</h3>
            </div>
            <ul>
              {group.options.map((option) => (
                <li key={option.label}>
                  <Link href={option.href === "/tire-iq#knowledge" && !hasKnowledge ? "/contact" : option.href}>
                    {option.label}
                    <span aria-hidden="true">↗</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
