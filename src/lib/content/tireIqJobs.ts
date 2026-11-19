export type TireIqJob = {
  key: "selection" | "understanding" | "validation" | "operation" | "diagnosis";
  label: string;
  outcome: string;
  href: string;
  destination: "catalog" | "knowledge" | "contact";
};

export type TireIqPrimaryAction = Pick<TireIqJob, "key" | "label" | "href" | "destination"> & {
  emphasis: "primary" | "secondary";
};

export const TIRE_IQ_PRIMARY_ACTIONS: readonly TireIqPrimaryAction[] = [
  { key: "selection", label: "Каталог моделей", href: "/models", destination: "catalog", emphasis: "primary" },
  { key: "validation", label: "Задать вопрос", href: "/contact", destination: "contact", emphasis: "secondary" },
];

export const TIRE_IQ_JOBS: readonly TireIqJob[] = [
  {
    key: "selection",
    label: "Каталог",
    outcome: "Посмотреть модели под вашу задачу.",
    href: "/models",
    destination: "catalog",
  },
  {
    key: "understanding",
    label: "Разобраться",
    outcome: "Понять маркировку, геометрию и назначение шины.",
    href: "/tire-iq#knowledge",
    destination: "knowledge",
  },
  {
    key: "validation",
    label: "Проверить",
    outcome: "Собрать вопросы для технической проверки решения.",
    href: "/contact",
    destination: "contact",
  },
  {
    key: "operation",
    label: "Эксплуатировать",
    outcome: "Разобраться с контролем состояния и эксплуатации.",
    href: "/tire-iq#knowledge",
    destination: "knowledge",
  },
  {
    key: "diagnosis",
    label: "Диагностировать",
    outcome: "Описать симптом и передать его специалисту.",
    href: "/contact",
    destination: "contact",
  },
];
