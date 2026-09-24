export type TireIqVisual = {
  id: string;
  title: string;
  purpose: string;
  master: string;
  web: string;
  preview?: string;
  svg?: string;
  annotationLayer: "svg-html" | "embedded-svg";
};

const base = "/images/tire-iq/production";

export const TIRE_IQ_VISUALS: readonly TireIqVisual[] = [
  { id: "VIS-04", title: "Полуприцеп и прицепные оси", purpose: "Выбор прицепной оси", master: `${base}/VIS-04-trailer-master.png`, web: `${base}/VIS-04-trailer-web.webp`, preview: `${base}/VIS-04-trailer-preview.png`, svg: `${base}/VIS-04-trailer.svg`, annotationLayer: "embedded-svg" },
  { id: "VIS-05", title: "Бетоносмеситель и ведущая группа", purpose: "Сравнение рулевой и ведущей осей", master: `${base}/VIS-05-construction-truck-master.png`, web: `${base}/VIS-05-construction-truck-web.webp`, preview: `${base}/VIS-05-construction-truck-preview.png`, svg: `${base}/VIS-05-construction-truck.svg`, annotationLayer: "embedded-svg" },
  { id: "VIS-10", title: "Боковина грузовой шины", purpose: "Декодер маркировки", master: `${base}/VIS-10-sidewall-master.png`, web: `${base}/VIS-10-sidewall-master-web.webp`, preview: `${base}/VIS-10-sidewall-master-mobile-check.png`, annotationLayer: "svg-html" },
  { id: "VIS-11", title: "Анатомия шины в разрезе", purpose: "Строение радиальной шины", master: `${base}/VIS-11-anatomy-cutaway-master.png`, web: `${base}/VIS-11-anatomy-cutaway-web.webp`, annotationLayer: "svg-html" },
  { id: "VIS-12", title: "Магистральный рисунок", purpose: "Рулевая ось и дальние перевозки", master: `${base}/VIS-12-highway-steer-tread-master.png`, web: `${base}/VIS-12-highway-steer-tread-web.webp`, annotationLayer: "svg-html" },
  { id: "VIS-13", title: "Региональный ведущий рисунок", purpose: "Тяга и смешанный маршрут", master: `${base}/VIS-13-regional-drive-tread-master.png`, web: `${base}/VIS-13-regional-drive-tread-web.webp`, annotationLayer: "svg-html" },
  { id: "VIS-14", title: "Прицепной ребристый рисунок", purpose: "Стабильность и качение", master: `${base}/VIS-14-trailer-rib-tread-master.png`, web: `${base}/VIS-14-trailer-rib-tread-web.webp`, annotationLayer: "svg-html" },
  { id: "VIS-15", title: "Строительный рисунок", purpose: "Строительство и on/off-road", master: `${base}/VIS-15-construction-tread-master.png`, web: `${base}/VIS-15-construction-tread-web.webp`, annotationLayer: "svg-html" },
  { id: "VIS-16", title: "Зимний рисунок", purpose: "Снег и лед", master: `${base}/VIS-16-winter-tread-master.png`, web: `${base}/VIS-16-winter-tread-web.webp`, annotationLayer: "svg-html" },
  { id: "VIS-20", title: "Пятно контакта при недодавлении", purpose: "Плечевая нагрузка", master: `${base}/VIS-20-contact-underinflated-master.png`, web: `${base}/VIS-20-contact-underinflated-web.webp`, annotationLayer: "svg-html" },
  { id: "VIS-21", title: "Номинальное пятно контакта", purpose: "Сбалансированный контакт", master: `${base}/VIS-21-contact-optimal-master.png`, web: `${base}/VIS-21-contact-optimal-web.webp`, annotationLayer: "svg-html" },
  { id: "VIS-22", title: "Пятно контакта при повышенном давлении", purpose: "Центральная нагрузка", master: `${base}/VIS-22-contact-overinflated-master.png`, web: `${base}/VIS-22-contact-overinflated-web.webp`, annotationLayer: "svg-html" },
  { id: "VIS-30", title: "Геометрия шины", purpose: "Технические определения размеров", master: `${base}/VIS-30-geometry-diagram-master.png`, web: `${base}/VIS-30-geometry-diagram-web.webp`, annotationLayer: "svg-html" },
  { id: "VIS-31", title: "Зазор в сдвоенной установке", purpose: "Геометрия пары шин", master: `${base}/VIS-31-dual-spacing-master.png`, web: `${base}/VIS-31-dual-spacing-web.webp`, annotationLayer: "svg-html" },
  { id: "VIS-32", title: "Распределение нагрузки по осям", purpose: "Рулевая, ведущая и прицепная группы", master: `${base}/VIS-32-axle-load-master.png`, web: `${base}/VIS-32-axle-load-web.webp`, annotationLayer: "svg-html" },
  { id: "VIS-33", title: "Измерение глубины протектора", purpose: "Правильная точка измерения", master: `${base}/VIS-33-tread-depth-master.png`, web: `${base}/VIS-33-tread-depth-web.webp`, annotationLayer: "svg-html" },
  { id: "VIS-34", title: "Рабочие поверхности", purpose: "Сухое, мокрое, гравий и грязь", master: `${base}/VIS-34-operating-surfaces-master.png`, web: `${base}/VIS-34-operating-surfaces-web.webp`, annotationLayer: "svg-html" },
  { id: "VIS-35", title: "Жизненный цикл шины", purpose: "Установка, эксплуатация, оценка и снятие", master: `${base}/VIS-35-lifecycle-master.png`, web: `${base}/VIS-35-lifecycle-web.webp`, annotationLayer: "svg-html" },
  { id: "VIS-36", title: "Температура и тепловая нагрузка", purpose: "Схематичная концентрация тепла", master: `${base}/VIS-36-temperature-heat-master.png`, web: `${base}/VIS-36-temperature-heat-web.webp`, annotationLayer: "svg-html" },
] as const;

const visualById = new Map(TIRE_IQ_VISUALS.map((visual) => [visual.id, visual]));

export const TIRE_IQ_ARTICLE_COVERS: Record<string, string> = {
  "cold-inflation-pressure-check": "VIS-21",
  "axle-role-in-tire-selection": "VIS-32",
  "uneven-tread-wear-first-checks": "VIS-33",
  "how-to-read-tire-size-marking": "VIS-10",
  "load-and-inflation-engineering-relationship": "VIS-30",
  "tire-lifecycle-inspection-basics": "VIS-35",
  "drive-axle-tire-selection": "VIS-13",
  "dual-fitment-tire-check": "VIS-31",
  "tbr-pre-trip-tire-inspection": "VIS-33",
  "quarry-tbr-operating-conditions": "VIS-15",
  "construction-route-tire-check": "VIS-05",
  "fleet-pressure-log-method": "VIS-21",
  "tire-damage-escalation": "VIS-36",
};

export function getTireIqArticleCover(slug: string): string | null {
  const visual = visualById.get(TIRE_IQ_ARTICLE_COVERS[slug]);
  return visual?.web ?? null;
}
