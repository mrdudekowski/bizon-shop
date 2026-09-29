import Image from "next/image";
import Link from "next/link";

import { PREMIUM_MEDIA } from "@/constants/images";
import { SiteArrow } from "@/components/SiteArrow/SiteArrow";

const APPLICATIONS = [
  {
    title: "Региональные маршруты",
    description: "Сцепление и контроль на мокром покрытии.",
    image: PREMIUM_MEDIA.wetRegional,
    href: "/models/tbr",
    alt: "Грузовой автомобиль на мокрой региональной дороге",
  },
  {
    title: "Смешанная эксплуатация",
    description: "Переход между строительной площадкой и дорогой.",
    image: PREMIUM_MEDIA.mixedService,
    href: "/models/tbr",
    alt: "Самосвал выезжает с грунта на асфальт",
  },
  {
    title: "Строительные площадки",
    description: "Тяговый рисунок для высокой нагрузки.",
    image: PREMIUM_MEDIA.constructionDetail,
    href: "/models/otr",
    alt: "Ведущие шины загруженного строительного самосвала",
  },
  {
    title: "Тяжёлые условия",
    description: "Работа на каменистом покрытии в сложную погоду.",
    image: PREMIUM_MEDIA.severeService,
    href: "/models/otr",
    alt: "Загруженный самосвал движется по каменистой дороге",
  },
  {
    title: "Рулевая ось",
    description: "Курсовая устойчивость и равномерный износ.",
    image: PREMIUM_MEDIA.steer385,
    href: "/models/tbr",
    alt: "Грузовая шина с продольным рисунком для рулевой оси",
  },
  {
    title: "Смешанный сервис",
    description: "Глубокий блок для стройки и бездорожья.",
    image: PREMIUM_MEDIA.mixedServiceTire,
    href: "/models/otr",
    alt: "Грузовая шина с глубоким блочным протектором",
  },
  {
    title: "Карьерная техника",
    description: "Крупный OTR-профиль для предельных нагрузок.",
    image: PREMIUM_MEDIA.otrTire,
    href: "/models/otr",
    alt: "Крупногабаритная карьерная шина с измерительной стойкой",
  },
];

export function ApplicationsSection() {
  return (
    <section className="section applications-section" aria-labelledby="applications-heading">
      <div className="section-heading">
        <p className="section-kicker">Условия эксплуатации</p>
        <h2 id="applications-heading" className="section-title">
          Шины под реальную работу
        </h2>
        <p className="section-description">
          От региональных маршрутов до стройки и карьера.
        </p>
      </div>

      <div className="applications-rail">
        {APPLICATIONS.map((application) => (
          <Link
            key={application.title}
            href={application.href}
            className="application-card"
          >
            <Image
              src={application.image}
              alt={application.alt}
              fill
              sizes="(max-width: 768px) 82vw, (max-width: 1280px) 42vw, 30vw"
            />
            <span className="application-card__overlay" aria-hidden="true" />
            <span className="application-card__content">
              <strong>{application.title}</strong>
              <span>{application.description}</span>
            </span>
            <span className="application-card__arrow" aria-hidden="true"><SiteArrow /></span>
          </Link>
        ))}
      </div>
    </section>
  );
}
